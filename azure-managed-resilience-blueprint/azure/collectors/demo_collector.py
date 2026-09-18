from __future__ import annotations

import json
from pathlib import Path

from azure.models.inventory import (
    InventorySnapshot,
    NormalizedCostSummary,
    NormalizedDrSummary,
    NormalizedResource,
    NormalizedSecuritySummary,
)


def load_demo_snapshot() -> InventorySnapshot:
    path = Path(__file__).parent / "demo_inventory.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    resources = [
        NormalizedResource(
            azure_id=r["azure_id"],
            name=r["name"],
            resource_type=r["type"],
            resource_group=r["resourceGroup"],
            location=r["location"],
            health=r.get("health", "unknown"),
            backup_protected=r.get("backup_protected"),
            monthly_cost_usd=r.get("monthly_cost_usd"),
            cpu_avg=r.get("cpu_avg"),
        )
        for r in data.get("resources", [])
    ]
    costs = data.get("costs", {})
    sec = data.get("security", {})
    dr = data.get("dr", {})
    return InventorySnapshot(
        subscription_id=data.get("subscription_id", "simulated"),
        resources=resources,
        costs=NormalizedCostSummary(
            current_month_usd=float(costs.get("current_month_usd", 0)),
            previous_month_usd=costs.get("previous_month_usd"),
            forecast_usd=costs.get("forecast_usd"),
            budget_usd=costs.get("budget_usd"),
            daily_yesterday=costs.get("daily_yesterday"),
            daily_today=costs.get("daily_today"),
            by_service=costs.get("by_service", {}),
            daily_series=costs.get("daily_series", []),
        ),
        dr=NormalizedDrSummary(
            protected_vms=int(dr.get("protected_vms", 0)),
            healthy=int(dr.get("healthy", 0)),
            warning=int(dr.get("warning", 0)),
            critical=int(dr.get("critical", 0)),
            last_dr_test=dr.get("last_dr_test"),
        ),
        security=NormalizedSecuritySummary(counts=sec),
        warnings=["Simulated inventory (demo mode)"],
        cost_anomalies=data.get("cost_anomalies", []),
    )
