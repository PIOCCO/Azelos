from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.cloud.factory import get_cloud_adapter
from app.models.cloud_resilience import CloudAccount, CloudResource
from app.models.enums import AuditAction
from app.models.enums_resilience import CloudResourceStatus, ProvenanceType
from app.services.platform_audit import record_platform_audit


def run_discovery(
    db: Session,
    *,
    organization_id: UUID,
    account: CloudAccount,
    actor: str,
) -> dict:
    adapter = get_cloud_adapter(account.provider)
    result = adapter.discover_resources(
        account.subscription_id,
        account.tenant_id,
        config_ref=account.auth_config_ref,
    )
    now = datetime.now(timezone.utc)
    account.last_discovery_at = now
    account.last_discovery_status = result.message

    upserted = 0
    for disc in result.resources:
        existing = db.scalar(
            select(CloudResource).where(
                CloudResource.cloud_account_id == account.id,
                CloudResource.provider_resource_id == disc.provider_resource_id,
            )
        )
        status = CloudResourceStatus.UNKNOWN
        if disc.status == "active":
            status = CloudResourceStatus.ACTIVE
        elif disc.status == "stopped":
            status = CloudResourceStatus.STOPPED

        if existing:
            existing.name = disc.name
            existing.resource_type = disc.resource_type
            existing.resource_group = disc.resource_group
            existing.region = disc.region
            existing.status = status
            existing.last_discovered_at = now
            existing.metadata_ = disc.metadata
            existing.provenance = ProvenanceType.DISCOVERED
        else:
            db.add(
                CloudResource(
                    financial_entity_id=organization_id,
                    cloud_account_id=account.id,
                    provider_resource_id=disc.provider_resource_id,
                    resource_type=disc.resource_type,
                    name=disc.name,
                    resource_group=disc.resource_group,
                    region=disc.region,
                    status=status,
                    provenance=ProvenanceType.DISCOVERED,
                    last_discovered_at=now,
                    metadata_=disc.metadata,
                )
            )
        upserted += 1

    record_platform_audit(
        db,
        organization_id=organization_id,
        actor=actor,
        entity_type="cloud_account",
        entity_id=account.id,
        action=AuditAction.RESOURCE_DISCOVERY,
        new_value={"resources_upserted": upserted, "message": result.message},
    )
    db.flush()
    return {
        "resources_upserted": upserted,
        "message": result.message,
        "credentials_configured": result.credentials_configured,
    }
