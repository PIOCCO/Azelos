from uuid import UUID

from sqlalchemy import select

from app.models.platform_config import OrganizationModule, PlatformModule
from app.repositories.base import OrgScopedRepository


class ModuleRepository(OrgScopedRepository):
    def list_catalogue(self) -> list[PlatformModule]:
        return list(self.db.scalars(select(PlatformModule).order_by(PlatformModule.key)).all())

    def enabled_module_ids(self) -> set[UUID]:
        rows = self.db.scalars(
            select(OrganizationModule.platform_module_id).where(
                OrganizationModule.financial_entity_id == self.organization_id,
                OrganizationModule.enabled.is_(True),
            )
        ).all()
        return set(rows)

    def assignment_map(self) -> dict[UUID, bool]:
        rows = self.db.scalars(
            select(OrganizationModule).where(
                OrganizationModule.financial_entity_id == self.organization_id
            )
        ).all()
        return {row.platform_module_id: row.enabled for row in rows}
