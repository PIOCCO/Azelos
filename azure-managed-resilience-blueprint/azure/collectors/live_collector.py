from __future__ import annotations

from azure.clients.cost_management import query_month_to_date
from azure.clients.resource_graph import query_resources
from azure.models.inventory import InventorySnapshot, NormalizedCostSummary, NormalizedDrSummary, NormalizedSecuritySummary


def fetch_live_snapshot(subscription_id: str) -> InventorySnapshot:
    errors: list[str] = []
    warnings: list[str] = []

    resources, rg_errors = query_resources(subscription_id)
    errors.extend(rg_errors)

    costs, cost_errors = query_month_to_date(subscription_id)
    errors.extend(cost_errors)

    # Backup, ASR, Defender: partial — enriched in future collectors
    if not resources:
        warnings.append("No resources returned from Resource Graph")

    return InventorySnapshot(
        subscription_id=subscription_id,
        resources=resources,
        costs=costs or NormalizedCostSummary(),
        dr=NormalizedDrSummary(),
        security=NormalizedSecuritySummary(),
        warnings=warnings,
        errors=errors,
    )
