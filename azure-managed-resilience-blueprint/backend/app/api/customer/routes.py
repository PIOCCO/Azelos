from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.api.customer.deps import customer_tenant_id, require_customer_admin, require_customer_user
from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.entities import (
    Alert,
    AlertStatus,
    AuditAction,
    AzureResource,
    Recommendation,
    RecommendationStatus,
    SecurityFinding,
    Tenant,
    TenantSettings,
    User,
)
from app.services.audit import log_audit
from app.services.customer_finops import (
    financial_data_available,
    get_anomalies,
    get_cost_by_resource,
    get_cost_by_service,
    get_daily_trends,
    get_financial_summary,
    get_savings_opportunities,
)
from app.services.reports import build_monthly_report_markdown, generate_monthly_report
from app.services.resilience_score import compute_resilience_score
from app.services.sync_engine import sync_status

router = APIRouter(prefix="/customer", tags=["customer"])


def _rid(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


@router.get("/overview")
def customer_overview(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    fin = get_financial_summary(db, tenant_id)
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).count()
    vms = db.query(AzureResource).filter(
        AzureResource.tenant_id == tenant_id, AzureResource.resource_type.ilike("%virtualMachines%")
    )
    vm_list = vms.all()
    protected = sum(1 for r in vm_list if r.backup_protected)
    coverage = int(100 * protected / len(vm_list)) if vm_list else 0
    open_alerts = (
        db.query(Alert)
        .filter(Alert.tenant_id == tenant_id, Alert.status != AlertStatus.RESOLVED)
        .count()
    )
    resilience = compute_resilience_score(db, tenant_id)
    return {
        "demo_mode": settings.demo_mode,
        "financial": fin,
        "resources_total": resources,
        "backup_coverage_pct": coverage,
        "open_alerts": open_alerts,
        "resilience_score": resilience["score"],
        "sync": sync_status(db, tenant_id),
    }


@router.get("/financial/summary")
def financial_summary(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    return get_financial_summary(db, tenant_id)


@router.get("/financial/trends")
def financial_trends(
    days: int = Query(30, ge=7, le=365),
    tenant_id: str = Depends(customer_tenant_id),
    db: Session = Depends(get_db),
):
    return get_daily_trends(db, tenant_id, days)


@router.get("/financial/services")
def financial_services(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    return get_cost_by_service(db, tenant_id)


@router.get("/financial/resources")
def financial_resources(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    return get_cost_by_resource(db, tenant_id)


@router.get("/financial/budget")
def financial_budget(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    fin = get_financial_summary(db, tenant_id)
    if not fin.get("data_available"):
        return {"data_available": False, "message": "Budget not configured"}
    if not fin.get("budget_configured"):
        return {"data_available": True, "budget_configured": False, "message": "Budget not configured"}
    return {
        "data_available": True,
        "budget_configured": True,
        "budget_usd": fin["budget_usd"],
        "current_spend_usd": fin["current_month_usd"],
        "utilization_pct": fin["budget_utilization_pct"],
        "remaining_usd": fin["budget_remaining_usd"],
        "period": datetime.now(timezone.utc).strftime("%Y-%m"),
    }


@router.get("/financial/forecast")
def financial_forecast(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    fin = get_financial_summary(db, tenant_id)
    if not fin.get("data_available"):
        return {"data_available": False, "message": "Forecast unavailable"}
    if fin.get("forecast_usd") is None:
        return {"data_available": True, "forecast_available": False, "message": "Forecast unavailable"}
    return {
        "data_available": True,
        "forecast_available": True,
        "forecast_usd": fin["forecast_usd"],
        "budget_usd": fin.get("budget_usd"),
        "expected_remaining_budget_usd": fin.get("forecast_remaining_budget_usd"),
        "disclaimer": "Forecast is an estimate from Azure Cost Management, not a guarantee.",
    }


@router.get("/financial/anomalies")
def financial_anomalies(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    return get_anomalies(db, tenant_id)


@router.get("/financial/savings")
def financial_savings(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    return get_savings_opportunities(db, tenant_id)


@router.get("/infrastructure")
def customer_infrastructure(
    search: str | None = Query(None),
    tenant_id: str = Depends(customer_tenant_id),
    db: Session = Depends(get_db),
):
    q = db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id)
    if search:
        q = q.filter(AzureResource.name.ilike(f"%{search}%"))
    rows = q.order_by(AzureResource.name).all()
    return {
        "resources": [
            {
                "id": r.id,
                "name": r.name,
                "resource_type": r.resource_type,
                "resource_group": r.resource_group,
                "location": r.location,
                "health_status": r.health_status,
                "backup_protected": r.backup_protected,
                "monthly_cost_usd": r.monthly_cost_usd,
            }
            for r in rows
        ]
    }


@router.get("/infrastructure/{resource_id}")
def customer_resource_detail(
    resource_id: str,
    tenant_id: str = Depends(customer_tenant_id),
    db: Session = Depends(get_db),
):
    r = db.get(AzureResource, resource_id)
    if not r or r.tenant_id != tenant_id:
        raise HTTPException(404, "Resource not found")
    recs = db.query(Recommendation).filter(Recommendation.tenant_id == tenant_id, Recommendation.resource_id == r.id).all()
    findings = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tenant_id, SecurityFinding.resource_id == r.id).all()
    return {
        "resource": {
            "id": r.id,
            "name": r.name,
            "resource_type": r.resource_type,
            "resource_group": r.resource_group,
            "location": r.location,
            "health_status": r.health_status,
            "backup_protected": r.backup_protected,
            "last_backup_at": r.last_backup_at.isoformat() if r.last_backup_at else None,
            "monthly_cost_usd": r.monthly_cost_usd,
        },
        "recommendations": [{"id": x.id, "title": x.title, "status": x.status.value} for x in recs],
        "security_findings": [{"severity": f.severity, "title": f.title} for f in findings],
    }


@router.get("/resilience")
def customer_resilience(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    return compute_resilience_score(db, tenant_id)


@router.get("/backups")
def customer_backups(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all()
    protected = [r for r in resources if r.backup_protected]
    unprotected = [r for r in resources if r.backup_protected is False]
    return {
        "protected_count": len(protected),
        "unprotected_count": len(unprotected),
        "total": len(resources),
        "coverage_pct": int(100 * len(protected) / len(resources)) if resources else 0,
        "unprotected": [{"name": r.name, "id": r.id} for r in unprotected],
    }


@router.get("/dr")
def customer_dr(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    from app.models.entities import DrSnapshot

    dr = (
        db.query(DrSnapshot).filter(DrSnapshot.tenant_id == tenant_id).order_by(DrSnapshot.captured_at.desc()).first()
    )
    if not dr:
        return {"protected_vms": 0, "healthy": 0, "last_dr_test": None}
    return {
        "protected_vms": dr.protected_vms,
        "healthy": dr.healthy,
        "warning": dr.warning,
        "critical": dr.critical,
        "last_dr_test": dr.last_dr_test,
    }


@router.get("/security")
def customer_security(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    findings = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tenant_id).all()
    counts: dict[str, int] = {}
    for f in findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1
    return {
        "counts": counts,
        "findings": [
            {"severity": f.severity, "title": f.title, "evidence": f.evidence, "what": f.title, "why": f.evidence}
            for f in findings
        ],
    }


@router.get("/alerts")
def customer_alerts(
    status: str | None = Query(None),
    severity: str | None = Query(None),
    tenant_id: str = Depends(customer_tenant_id),
    db: Session = Depends(get_db),
):
    q = db.query(Alert).filter(Alert.tenant_id == tenant_id)
    if status:
        q = q.filter(Alert.status == AlertStatus(status))
    if severity:
        q = q.filter(Alert.severity == severity)
    rows = q.order_by(Alert.detected_at.desc()).all()
    return [
        {
            "id": a.id,
            "severity": a.severity.value,
            "category": a.category.value,
            "status": a.status.value,
            "title": a.title,
            "message": a.message,
            "detected_at": a.detected_at.isoformat(),
        }
        for a in rows
    ]


@router.get("/recommendations")
def customer_recommendations(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    return get_savings_opportunities(db, tenant_id)


@router.post("/recommendations/{rec_id}/approve")
def customer_approve_rec(
    rec_id: str,
    request: Request,
    user: User = Depends(require_customer_admin),
    tenant_id: str = Depends(customer_tenant_id),
    db: Session = Depends(get_db),
):
    rec = db.get(Recommendation, rec_id)
    if not rec or rec.tenant_id != tenant_id:
        raise HTTPException(404, "Not found")
    rec.status = RecommendationStatus.APPROVED
    db.commit()
    log_audit(
        db,
        AuditAction.RECOMMENDATION_APPROVED,
        tenant_id=tenant_id,
        user_id=user.id,
        request_id=_rid(request),
        resource_id=rec.resource_id,
        detail=rec.title,
    )
    return {"status": rec.status.value}


@router.post("/recommendations/{rec_id}/dismiss")
def customer_dismiss_rec(
    rec_id: str,
    request: Request,
    user: User = Depends(require_customer_admin),
    tenant_id: str = Depends(customer_tenant_id),
    db: Session = Depends(get_db),
):
    rec = db.get(Recommendation, rec_id)
    if not rec or rec.tenant_id != tenant_id:
        raise HTTPException(404, "Not found")
    rec.status = RecommendationStatus.DISMISSED
    db.commit()
    log_audit(
        db,
        AuditAction.CONFIGURATION_CHANGED,
        tenant_id=tenant_id,
        user_id=user.id,
        request_id=_rid(request),
        detail=f"dismissed recommendation {rec.title}",
    )
    return {"status": rec.status.value}


@router.get("/reports/monthly")
def customer_monthly_report(
    request: Request,
    user: User = Depends(require_customer_user),
    tenant_id: str = Depends(customer_tenant_id),
    db: Session = Depends(get_db),
):
    tenant = db.get(Tenant, tenant_id)
    name = tenant.name if tenant else tenant_id
    report = generate_monthly_report(db, tenant_id, name)
    log_audit(
        db,
        AuditAction.REPORT_GENERATED,
        tenant_id=tenant_id,
        user_id=user.id,
        request_id=_rid(request),
        detail="customer monthly report",
    )
    return {"period": report.period, "markdown": report.body_markdown}


@router.get("/settings")
def customer_settings(tenant_id: str = Depends(customer_tenant_id), db: Session = Depends(get_db)):
    tenant = db.get(Tenant, tenant_id)
    tenant_settings = db.get(TenantSettings, tenant_id)
    return {
        "company_name": (tenant_settings.company_name if tenant_settings else None) or (tenant.name if tenant else None),
        "azure_subscription_id": tenant.azure_subscription_id if tenant else None,
        "monthly_budget_usd": tenant_settings.monthly_budget_usd if tenant_settings else None,
        "demo_mode": settings.demo_mode,
    }
