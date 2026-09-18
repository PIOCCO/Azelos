from __future__ import annotations

import httpx

from azure.clients.base import get_bearer_token, logger


KQL = """
RecoveryServicesResources
| where type =~ 'microsoft.recoveryservices/vaults/backupfabrics/protectioncontainers/protecteditems'
| where subscriptionId == '{subscription_id}'
| project vaultId, properties
"""


def protected_vm_ids(subscription_id: str) -> tuple[set[str], list[str]]:
    errors: list[str] = []
    token = get_bearer_token()
    if not token:
        return set(), ["Azure credential unavailable for Backup inventory"]
    body = {
        "subscriptions": [subscription_id],
        "query": KQL.format(subscription_id=subscription_id),
    }
    protected: set[str] = set()
    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=body,
            )
            resp.raise_for_status()
            for row in resp.json().get("data", []):
                props = row.get("properties", {}) or {}
                source_id = props.get("sourceResourceId") or props.get("virtualMachineId")
                if source_id:
                    protected.add(source_id.lower())
    except Exception as exc:  # noqa: BLE001
        logger.warning("backup_graph_failed", extra={"error": str(exc)})
        errors.append(str(exc))
    return protected, errors
