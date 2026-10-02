"""Ensure new organizations have module assignments so nav and ModuleGate work."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.platform_config import OrganizationModule, PlatformModule


def ensure_default_module_assignments(db: Session, organization_id: UUID) -> None:
    """Enable all platform modules when an org has no module rows yet (first login / provision)."""
    existing = (
        db.scalar(
            select(func.count())
            .select_from(OrganizationModule)
            .where(OrganizationModule.financial_entity_id == organization_id)
        )
        or 0
    )
    if existing > 0:
        return
    catalogue = db.scalars(select(PlatformModule).order_by(PlatformModule.key)).all()
    for mod in catalogue:
        db.add(
            OrganizationModule(
                financial_entity_id=organization_id,
                platform_module_id=mod.id,
                enabled=True,
            )
        )
    db.flush()
