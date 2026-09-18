from __future__ import annotations

import httpx

from azure.clients.base import get_bearer_token, logger
from azure.models.inventory import NormalizedResource


KQL = """
Resources
| where subscriptionId == '{subscription_id}'
| project id, name, type, resourceGroup, location
| limit 500
"""


def query_resources(subscription_id: str) -> tuple[list[NormalizedResource], list[str]]:
    errors: list[str] = []
    token = get_bearer_token()
    if not token:
        errors.append("Azure credential unavailable for Resource Graph")
        return [], errors

    body = {
        "subscriptions": [subscription_id],
        "query": KQL.format(subscription_id=subscription_id),
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:  # noqa: BLE001
        logger.warning("resource_graph_failed", extra={"error": str(exc)})
        errors.append(f"Resource Graph query failed: {exc}")
        return [], errors

    resources: list[NormalizedResource] = []
    for row in data.get("data", []):
        resources.append(
            NormalizedResource(
                azure_id=row.get("id", ""),
                name=row.get("name", ""),
                resource_type=row.get("type", ""),
                resource_group=row.get("resourceGroup", ""),
                location=row.get("location", ""),
                health="unknown",
            )
        )
    return resources, errors
