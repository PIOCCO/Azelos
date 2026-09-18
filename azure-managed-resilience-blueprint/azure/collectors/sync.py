"""Persist normalized Azure inventory into PostgreSQL."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import (
    AzureResource,
    CostAnomalyRecord,
    CostDailyRecord,
    CostServiceRecord,
    CostSnapshot,
    DrSnapshot,
    SecurityFinding,
    TenantSettings,
)
from azure.collectors.demo_collector import load_demo_snapshot
from azure.collectors.live_collector import fetch_live_snapshot
from azure.models.inventory import InventorySnapshot


def _load_snapshot(subscription_id: str) -> InventorySnapshot:
    if settings.demo_mode:
        return load_demo_snapshot()
    if not subscription_id:
        raise ValueError("AZURE_SUBSCRIPTION_ID required when DEMO_MODE=false")
    return fetch_live_snapshot(subscription_id)


def apply_snapshot(db: Session, tenant_id: str, snap: InventorySnapshot) -> dict:
    seen: set[str] = set()
    for r in snap.resources:
        seen.add(r.azure_id)
        row = (
            db.query(AzureResource)
            .filter(AzureResource.tenant_id == tenant_id, AzureResource.azure_id == r.azure_id)
            .first()
        )
        if not row:
            row = AzureResource(tenant_id=tenant_id, azure_id=r.azure_id, name=r.name)
            db.add(row)
        row.name = r.name
        row.resource_type = r.resource_type
        row.resource_group = r.resource_group
        row.location = r.location
        row.health_status = r.health
        row.backup_protected = r.backup_protected
        row.last_backup_at = r.last_backup_at
        row.monthly_cost_usd = r.monthly_cost_usd
        row.updated_at = datetime.now(timezone.utc)

    for old in db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all():
        if old.azure_id not in seen:
            db.delete(old)

    costs = snap.costs
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    db.add(
        CostSnapshot(
            tenant_id=tenant_id,
            period=period,
            amount_usd=float(costs.current_month_usd or 0),
            previous_period_usd=costs.previous_month_usd,
            forecast_usd=costs.forecast_usd,
            budget_usd=costs.budget_usd,
        )
    )

    db.query(CostDailyRecord).filter(CostDailyRecord.tenant_id == tenant_id).delete()
    for row in costs.daily_series:
        db.add(
            CostDailyRecord(
                tenant_id=tenant_id,
                day=row["day"],
                amount_usd=float(row["amount"]),
            )
        )

    db.query(CostServiceRecord).filter(
        CostServiceRecord.tenant_id == tenant_id, CostServiceRecord.period == period
    ).delete()
    for service, amount in costs.by_service.items():
        db.add(
            CostServiceRecord(
                tenant_id=tenant_id,
                period=period,
                service_name=service,
                amount_usd=float(amount),
            )
        )

    db.query(CostAnomalyRecord).filter(CostAnomalyRecord.tenant_id == tenant_id).delete()
    for a in snap.cost_anomalies:
        resource_id = None
        if a.get("resource_name"):
            res = (
                db.query(AzureResource)
                .filter(AzureResource.tenant_id == tenant_id, AzureResource.name == a["resource_name"])
                .first()
            )
            resource_id = res.id if res else None
        db.add(
            CostAnomalyRecord(
                tenant_id=tenant_id,
                category=a.get("category", "Cost"),
                resource_name=a.get("resource_name"),
                resource_id=resource_id,
                observed_spend=a.get("observed_spend"),
                comparison_period=a.get("comparison_period"),
                pct_change=a.get("pct_change"),
                evidence=a.get("evidence", ""),
            )
        )

    settings_row = db.get(TenantSettings, tenant_id)
    if not settings_row:
        settings_row = TenantSettings(tenant_id=tenant_id)
        db.add(settings_row)
    if costs.budget_usd is not None:
        settings_row.monthly_budget_usd = costs.budget_usd

    db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tenant_id).delete()
    for sev, count in snap.security.counts.items():
        if count:
            db.add(
                SecurityFinding(
                    tenant_id=tenant_id,
                    severity=sev,
                    title=f"{sev.title()} findings (Defender / Policy)",
                    evidence=f"count={count}",
                )
            )
    for f in snap.security.findings:
        db.add(
            SecurityFinding(
                tenant_id=tenant_id,
                severity=f.get("severity", "medium"),
                title=f.get("title", "Finding"),
                evidence=f.get("evidence", ""),
            )
        )

    dr = snap.dr
    db.add(
        DrSnapshot(
            tenant_id=tenant_id,
            protected_vms=dr.protected_vms,
            healthy=dr.healthy,
            warning=dr.warning,
            critical=dr.critical,
            last_dr_test=dr.last_dr_test,
        )
    )

    db.commit()
    cost_records = len(costs.daily_series) + len(costs.by_service) + len(snap.cost_anomalies)
    return {
        "resources_synced": len(seen),
        "cost_records_processed": cost_records,
        "costs": {
            "current_month_usd": costs.current_month_usd,
            "forecast_usd": costs.forecast_usd,
            "budget_usd": costs.budget_usd,
            "daily_yesterday": costs.daily_yesterday,
            "daily_today": costs.daily_today,
        },
        "dr": {
            "protected_vms": dr.protected_vms,
            "healthy": dr.healthy,
            "warning": dr.warning,
            "critical": dr.critical,
            "last_dr_test": dr.last_dr_test,
        },
        "security": snap.security.counts,
        "warnings": snap.warnings,
        "errors": snap.errors,
    }


def sync_tenant(db: Session, tenant_id: str, subscription_id: str) -> dict:
    snap = _load_snapshot(subscription_id)
    return apply_snapshot(db, tenant_id, snap)
