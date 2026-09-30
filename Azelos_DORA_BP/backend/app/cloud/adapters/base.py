"""Cloud provider abstraction for resource discovery."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class DiscoveredResource:
    provider_resource_id: str
    resource_type: str
    name: str
    resource_group: str | None = None
    region: str | None = None
    status: str = "unknown"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class DiscoveryResult:
    resources: list[DiscoveredResource]
    message: str
    credentials_configured: bool


class CloudProviderAdapter(ABC):
    @abstractmethod
    def discover_resources(
        self,
        subscription_id: str,
        tenant_id: str | None,
        *,
        config_ref: str | None = None,
    ) -> DiscoveryResult:
        """Return discovered resources; never fabricate inventory."""
