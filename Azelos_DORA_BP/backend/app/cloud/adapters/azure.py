"""Azure resource discovery via server-side credentials only."""

from __future__ import annotations

import os
from typing import Any

from app.cloud.adapters.base import CloudProviderAdapter, DiscoveredResource, DiscoveryResult

_AZURE_RESOURCE_TYPES = (
    "Microsoft.Compute/virtualMachines",
    "Microsoft.Network/virtualNetworks",
    "Microsoft.Storage/storageAccounts",
    "Microsoft.Sql/servers",
    "Microsoft.DBforPostgreSQL/flexibleServers",
    "Microsoft.Web/sites",
    "Microsoft.KeyVault/vaults",
    "Microsoft.ContainerService/managedClusters",
    "Microsoft.Network/loadBalancers",
    "Microsoft.RecoveryServices/vaults",
)


class AzureProviderAdapter(CloudProviderAdapter):
    def _resolve_credentials(self, config_ref: str | None) -> tuple[str | None, str | None, str | None]:
        prefix = (config_ref or "AZURE").strip().upper()
        tenant = os.getenv(f"{prefix}_TENANT_ID") or os.getenv("AZURE_TENANT_ID")
        client_id = os.getenv(f"{prefix}_CLIENT_ID") or os.getenv("AZURE_CLIENT_ID")
        client_secret = os.getenv(f"{prefix}_CLIENT_SECRET") or os.getenv("AZURE_CLIENT_SECRET")
        if not all([tenant, client_id, client_secret]):
            return None, None, None
        return tenant, client_id, client_secret

    def discover_resources(
        self,
        subscription_id: str,
        tenant_id: str | None,
        *,
        config_ref: str | None = None,
    ) -> DiscoveryResult:
        tenant, client_id, client_secret = self._resolve_credentials(config_ref)
        if not all([tenant, client_id, client_secret]):
            return DiscoveryResult(
                resources=[],
                message="Azure credentials not configured on server; discovery skipped.",
                credentials_configured=False,
            )

        try:
            from azure.identity import ClientSecretCredential
            from azure.mgmt.resource import ResourceManagementClient
        except ImportError:
            return DiscoveryResult(
                resources=[],
                message="Azure SDK not installed (optional dependency [azure]).",
                credentials_configured=True,
            )

        credential = ClientSecretCredential(
            tenant_id=tenant,
            client_id=client_id,
            client_secret=client_secret,
        )
        client = ResourceManagementClient(credential, subscription_id)
        resources: list[DiscoveredResource] = []
        filter_types = set(_AZURE_RESOURCE_TYPES)

        for item in client.resources.list():
            rtype = getattr(item, "type", None) or ""
            if rtype not in filter_types:
                continue
            rid = getattr(item, "id", None)
            if not rid:
                continue
            name = getattr(item, "name", "") or rid.split("/")[-1]
            rg = None
            parts = rid.split("/")
            if "resourceGroups" in parts:
                rg = parts[parts.index("resourceGroups") + 1]
            region = getattr(item, "location", None)
            resources.append(
                DiscoveredResource(
                    provider_resource_id=rid,
                    resource_type=rtype,
                    name=name,
                    resource_group=rg,
                    region=region,
                    status="active",
                    metadata={"sku": _safe_json(getattr(item, "sku", None))},
                )
            )

        return DiscoveryResult(
            resources=resources,
            message=f"Discovered {len(resources)} resources from Azure Resource Graph API.",
            credentials_configured=True,
        )


def _safe_json(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, "as_dict"):
        return value.as_dict()
    return str(value)
