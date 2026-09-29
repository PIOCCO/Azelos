from uuid import UUID

from sqlalchemy import func, select

from app.models.service import ICTService
from app.repositories.base import OrgScopedRepository


class ICTServiceRepository(OrgScopedRepository):
    def get(self, service_id: UUID) -> ICTService | None:
        row = self.db.get(ICTService, service_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(self, page: int, page_size: int) -> tuple[list[ICTService], int]:
        total = (
            self.db.scalar(
                select(func.count(ICTService.id)).where(
                    ICTService.financial_entity_id == self.organization_id
                )
            )
            or 0
        )
        rows = self.db.scalars(
            select(ICTService)
            .where(ICTService.financial_entity_id == self.organization_id)
            .order_by(ICTService.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, row: ICTService) -> ICTService:
        row.financial_entity_id = self.organization_id
        self.db.add(row)
        self.db.flush()
        return row
