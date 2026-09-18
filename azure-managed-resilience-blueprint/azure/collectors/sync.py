"""Sync Azure inventory — mock demo or live Resource Graph."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import AzureResource, CostSnapshot, DrSnapshot, SecurityFinding


def _load_demo() -> dict:
    path = Path(__file__).parent / "demo_inventory.json"
    return json.loads(path.read_text(encoding="utf-8"))


def sync_tenant(db: Session, tenant_id: str) -> dict:
    if settings.azure_mock or not settings.azure_subscription_id:
        data = _load_demo()
    else:
        data = _fetch_live(settings.azure_subscription_id)

    seen = set()
    for r in data.get("resources", []):
        seen.add(r["azure_id"])
        row = (
            db.query(AzureResource)
            .filter(AzureResource.tenant_id == tenant_id, AzureResource.azure_id == r["azure_id"])
            .first()
        )
        if not row:
            row = AzureResource(tenant_id=tenant_id, azure_id=r["azure_id"], name=r["name"])
            db.add(row)
        row.name = r["name"]
        row.resource_type = r["type"]
        row.resource_group = r["resourceGroup"]
        row.location = r["location"]
        row.health_status = r.get("health", "unknown")
        row.backup_protected = r.get("backup_protected")
        row.monthly_cost_usd = r.get("monthly_cost_usd")
        row.updated_at = datetime.now(timezone.utc)

    # remove stale (demo only keeps listed)
    for old in db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all():
        if old.azure_id not in seen:
            db.delete(old)

    costs = data.get("costs", {})
    db.add(
        CostSnapshot(
            tenant_id=tenant_id,
            period=datetime.now(timezone.utc).strftime("%Y-%m"),
            amount_usd=float(costs.get("current_month_usd", 0)),
            forecast_usd=float(costs.get("forecast_usd", 0)) if costs.get("forecast_usd") else None,
            budget_usd=float(costs.get("budget_usd", 0)) if costs.get("budget_usd") else None,
        )
    )

    db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tenant_id).delete()
    sec = data.get("security", {})
    for sev, count in sec.items():
        if count:
            db.add(
                SecurityFinding(
                    tenant_id=tenant_id,
                    severity=sev,
                    title=f"Aggregated {sev} findings from Defender/Policy",
                    evidence=f"count={count}",
                )
            )
    dr = data.get("dr", {})
    db.add(
        DrSnapshot(
            tenant_id=tenant_id,
            protected_vms=int(dr.get("protected_vms", 0)),
            healthy=int(dr.get("healthy", 0)),
            warning=int(dr.get("warning", 0)),
            critical=int(dr.get("critical", 0)),
            last_dr_test=dr.get("last_dr_test"),
        )
    )

    db.commit()
    return {"resources_synced": len(seen), "costs": costs, "dr": dr, "security": sec}


def _fetch_live(subscription_id: str) -> dict:
    # Live path: extend with Resource Graph KQL + Cost Management API
    raise NotImplementedError("Set AZURE_MOCK=true for MVP demo or implement live collectors")
