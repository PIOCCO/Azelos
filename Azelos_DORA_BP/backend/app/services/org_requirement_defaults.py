"""Ensure organization requirement rows exist for every baseline DORA requirement."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dora_baseline import DoraRequirement, OrganizationRequirement


def ensure_organization_requirements(db: Session, organization_id: UUID) -> None:
    """Backfill missing org requirement rows (legacy tenants created before provisioning hook)."""
    baseline_ids = set(db.scalars(select(DoraRequirement.id)).all())
    if not baseline_ids:
        return
    existing = set(
        db.scalars(
            select(OrganizationRequirement.dora_requirement_id).where(
                OrganizationRequirement.financial_entity_id == organization_id
            )
        ).all()
    )
    missing = baseline_ids - existing
    for dora_requirement_id in missing:
        db.add(
            OrganizationRequirement(
                financial_entity_id=organization_id,
                dora_requirement_id=dora_requirement_id,
                applicable=True,
                implementation_status="not_started",
            )
        )
    if missing:
        db.flush()
