from uuid import UUID

from sqlalchemy import func, select

from app.models.subcontractor import Subcontractor
from app.repositories.base import OrgScopedRepository


class SubcontractorRepository(OrgScopedRepository):
    def get(self, row_id: UUID) -> Subcontractor | None:
        row = self.db.get(Subcontractor, row_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(self, page: int, page_size: int) -> tuple[list[Subcontractor], int]:
        total = (
            self.db.scalar(
                select(func.count(Subcontractor.id)).where(
                    Subcontractor.financial_entity_id == self.organization_id
                )
            )
            or 0
        )
        rows = self.db.scalars(
            select(Subcontractor)
            .where(Subcontractor.financial_entity_id == self.organization_id)
            .order_by(Subcontractor.legal_name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, row: Subcontractor) -> Subcontractor:
        row.financial_entity_id = self.organization_id
        self.db.add(row)
        self.db.flush()
        return row
