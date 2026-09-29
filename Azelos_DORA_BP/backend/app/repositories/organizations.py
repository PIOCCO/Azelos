from uuid import UUID

from sqlalchemy import func, select

from app.models.financial_entity import FinancialEntity
from app.repositories.base import OrgScopedRepository


class OrganizationRepository(OrgScopedRepository):
    def get(self, org_id: UUID) -> FinancialEntity | None:
        return self.db.get(FinancialEntity, org_id)

    def list_paginated(self, page: int, page_size: int) -> tuple[list[FinancialEntity], int]:
        total = self.db.scalar(select(func.count()).select_from(FinancialEntity)) or 0
        rows = self.db.scalars(
            select(FinancialEntity)
            .order_by(FinancialEntity.legal_name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, entity: FinancialEntity) -> FinancialEntity:
        self.db.add(entity)
        self.db.flush()
        return entity
