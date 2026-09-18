from __future__ import annotations

from datetime import datetime, timezone

import httpx

from azure.clients.base import get_bearer_token, logger
from azure.models.inventory import NormalizedCostSummary


def query_month_to_date(subscription_id: str) -> tuple[NormalizedCostSummary, list[str]]:
    errors: list[str] = []
    token = get_bearer_token()
    if not token:
        errors.append("Azure credential unavailable for Cost Management")
        return NormalizedCostSummary(), errors

    start = datetime.now(timezone.utc).replace(day=1).strftime("%Y-%m-%d")
    end = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}/providers/"
        f"Microsoft.CostManagement/query?api-version=2023-03-01"
    )
    payload = {
        "type": "ActualCost",
        "timeframe": "Custom",
        "timePeriod": {"from": start, "to": end},
        "dataset": {
            "granularity": "None",
            "aggregation": {"totalCost": {"name": "Cost", "function": "Sum"}},
        },
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=payload,
            )
            if resp.status_code >= 400:
                errors.append(f"Cost Management returned {resp.status_code}")
                return NormalizedCostSummary(), errors
            data = resp.json()
    except Exception as exc:  # noqa: BLE001
        logger.warning("cost_management_failed", extra={"error": str(exc)})
        errors.append(f"Cost Management query failed: {exc}")
        return NormalizedCostSummary(), errors

    rows = data.get("properties", {}).get("rows", [])
    amount = float(rows[0][0]) if rows else 0.0
    return NormalizedCostSummary(current_month_usd=amount), errors
