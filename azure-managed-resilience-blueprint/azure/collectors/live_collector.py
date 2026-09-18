from __future__ import annotations

from azure.clients.advisor import fetch_cost_recommendations
from azure.clients.backup import protected_vm_ids
from azure.clients.cost_management import query_month_to_date
from azure.clients.defender import fetch_secure_scores
from azure.clients.resource_graph import query_resources
from azure.models.inventory import InventorySnapshot, NormalizedCostSummary, NormalizedDrSummary, NormalizedSecuritySummary


def fetch_live_snapshot(subscription_id: str) -> InventorySnapshot:
    errors: list[str] = []
    warnings: list[str] = []

    resources, rg_errors = query_resources(subscription_id)
    errors.extend(rg_errors)

    costs, cost_errors = query_month_to_date(subscription_id)
    errors.extend(cost_errors)

    protected, backup_errors = protected_vm_ids(subscription_id)
    errors.extend(backup_errors)
    for r in resources:
        if "virtualMachines" in r.resource_type.lower():
            r.backup_protected = r.azure_id.lower() in protected

    defender_counts, def_errors = fetch_secure_scores(subscription_id)
    errors.extend(def_errors)
    advisor_findings, adv_errors = fetch_cost_recommendations(subscription_id)
    errors.extend(adv_errors)

    if not resources:
        warnings.append("No resources returned from Resource Graph")

    return InventorySnapshot(
        subscription_id=subscription_id,
        resources=resources,
        costs=costs or NormalizedCostSummary(),
        dr=NormalizedDrSummary(),
        security=NormalizedSecuritySummary(counts=defender_counts, findings=advisor_findings),
        warnings=warnings,
        errors=errors,
    )
