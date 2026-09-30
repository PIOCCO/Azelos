from app.cloud.adapters.azure import AzureProviderAdapter
from app.cloud.adapters.base import CloudProviderAdapter
from app.models.enums_resilience import CloudProviderType


def get_cloud_adapter(provider: CloudProviderType) -> CloudProviderAdapter:
    if provider == CloudProviderType.AZURE:
        return AzureProviderAdapter()
    raise ValueError(f"Cloud provider {provider.value} is not implemented yet")
