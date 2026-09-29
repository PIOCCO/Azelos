from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.dora_baseline import DoraRequirement, OrganizationRequirement
from app.repositories.base import OrgScopedRepository


class RequirementRepository:
    def __init__(self, db, organization_id: UUID | None = None) -> None:
        self.db = db
        self.organization_id = organization_id

    def list_baseline(self) -> list[DoraRequirement]:
        return list(self.db.scalars(select(DoraRequirement).order_by(DoraRequirement.code)).all())

    def get_baseline(self, requirement_id: UUID) -> DoraRequirement | None:
        return self.db.get(DoraRequirement, requirement_id)

    def list_organization_implementation(self) -> list[OrganizationRequirement]:
        assert self.organization_id is not None
        return list(
            self.db.scalars(
                select(OrganizationRequirement)
                .where(OrganizationRequirement.financial_entity_id == self.organization_id)
                .options(selectinload(OrganizationRequirement.requirement))
            ).all()
        )
