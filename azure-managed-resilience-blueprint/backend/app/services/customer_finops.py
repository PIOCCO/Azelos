from sqlalchemy.orm import Session

from app.models.entities import (
    AzureResource,
    CostAnomalyRecord,
    CostDailyRecord,
    CostServiceRecord,
    CostSnapshot,
    Recommendation,
    RecommendationCategory,
    RecommendationStatus,
    TenantSettings,
)


def _latest_snapshot(db: Session, tenant_id: str) -> CostSnapshot | None:
    return (
        db.query(CostSnapshot)
        .filter(CostSnapshot.tenant_id == tenant_id)
        .order_by(CostSnapshot.captured_at.desc())
        .first()
    )


def financial_data_available(db: Session, tenant_id: str) -> bool:
    snap = _latest_snapshot(db, tenant_id)
    if snap and snap.amount_usd is not None:
        return True
    return db.query(CostDailyRecord).filter(CostDailyRecord.tenant_id == tenant_id).count() > 0


def get_financial_summary(db: Session, tenant_id: str) -> dict:
    snap = _latest_snapshot(db, tenant_id)
    settings = db.get(TenantSettings, tenant_id)
    if not snap and not financial_data_available(db, tenant_id):
        return {"data_available": False}

    current = snap.amount_usd if snap else 0.0
    previous = snap.previous_period_usd if snap else None
    budget = (settings.monthly_budget_usd if settings and settings.monthly_budget_usd else None) or (
        snap.budget_usd if snap else None
    )
    forecast = snap.forecast_usd if snap else None
    pct_change = None
    if previous and previous > 0:
        pct_change = round(100 * (current - previous) / previous, 1)

    savings = sum(
        r.estimated_savings_usd or 0
        for r in db.query(Recommendation)
        .filter(
            Recommendation.tenant_id == tenant_id,
            Recommendation.category == RecommendationCategory.FINOPS,
            Recommendation.status != RecommendationStatus.DISMISSED,
        )
        .all()
    )

    utilization = round(100 * current / budget, 1) if budget else None
    return {
        "data_available": True,
        "current_month_usd": current,
        "previous_month_usd": previous,
        "month_over_month_pct": pct_change,
        "budget_usd": budget,
        "budget_configured": budget is not None,
        "budget_utilization_pct": utilization,
        "budget_remaining_usd": (budget - current) if budget is not None else None,
        "forecast_usd": forecast,
        "forecast_remaining_budget_usd": (budget - forecast) if budget is not None and forecast is not None else None,
        "potential_savings_usd": savings,
    }


def get_daily_trends(db: Session, tenant_id: str, days: int = 30) -> dict:
    rows = (
        db.query(CostDailyRecord)
        .filter(CostDailyRecord.tenant_id == tenant_id)
        .order_by(CostDailyRecord.day.desc())
        .limit(days)
        .all()
    )
    if not rows:
        return {"data_available": False, "points": []}
    points = [{"day": r.day, "amount_usd": r.amount_usd} for r in reversed(rows)]
    return {"data_available": True, "points": points}


def get_cost_by_service(db: Session, tenant_id: str) -> dict:
    from datetime import datetime, timezone

    period = datetime.now(timezone.utc).strftime("%Y-%m")
    rows = (
        db.query(CostServiceRecord)
        .filter(CostServiceRecord.tenant_id == tenant_id, CostServiceRecord.period == period)
        .order_by(CostServiceRecord.amount_usd.desc())
        .all()
    )
    if not rows:
        return {"data_available": False, "services": []}
    total = sum(r.amount_usd for r in rows)
    services = [
        {
            "service_name": r.service_name,
            "amount_usd": r.amount_usd,
            "share_pct": round(100 * r.amount_usd / total, 1) if total else 0,
        }
        for r in rows
    ]
    return {"data_available": True, "total_usd": total, "services": services}


def get_cost_by_resource(db: Session, tenant_id: str) -> dict:
    resources = (
        db.query(AzureResource)
        .filter(AzureResource.tenant_id == tenant_id, AzureResource.monthly_cost_usd.isnot(None))
        .order_by(AzureResource.monthly_cost_usd.desc())
        .all()
    )
    if not resources:
        return {"data_available": False, "resources": []}
    return {
        "data_available": True,
        "resources": [
            {
                "id": r.id,
                "name": r.name,
                "resource_type": r.resource_type,
                "resource_group": r.resource_group,
                "location": r.location,
                "amount_usd": r.monthly_cost_usd,
                "health_status": r.health_status,
            }
            for r in resources
        ],
    }


def get_anomalies(db: Session, tenant_id: str) -> dict:
    rows = (
        db.query(CostAnomalyRecord)
        .filter(CostAnomalyRecord.tenant_id == tenant_id)
        .order_by(CostAnomalyRecord.detected_at.desc())
        .all()
    )
    return {
        "data_available": bool(rows),
        "anomalies": [
            {
                "id": a.id,
                "category": a.category,
                "resource_name": a.resource_name,
                "resource_id": a.resource_id,
                "observed_spend": a.observed_spend,
                "comparison_period": a.comparison_period,
                "pct_change": a.pct_change,
                "evidence": a.evidence,
                "detected_at": a.detected_at.isoformat(),
            }
            for a in rows
        ],
    }


def get_savings_opportunities(db: Session, tenant_id: str) -> dict:
    rows = (
        db.query(Recommendation)
        .filter(
            Recommendation.tenant_id == tenant_id,
            Recommendation.status != RecommendationStatus.DISMISSED,
        )
        .order_by(Recommendation.priority)
        .all()
    )
    return {
        "data_available": bool(rows),
        "opportunities": [
            {
                "id": r.id,
                "title": r.title,
                "category": r.category.value,
                "resource_id": r.resource_id,
                "estimated_savings_usd": r.estimated_savings_usd,
                "problem": r.problem,
                "evidence": r.evidence,
                "suggested_action": r.suggested_action,
                "risk": r.risk,
                "status": r.status.value,
            }
            for r in rows
        ],
    }
