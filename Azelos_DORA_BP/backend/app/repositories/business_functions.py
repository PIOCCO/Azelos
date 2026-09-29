from uuid import UUID

from sqlalchemy import func, select

from app.models.business_function import BusinessFunction
from app.repositories.base import OrgScopedRepository


class BusinessFunctionRepository(OrgScopedRepository):
    def get(self, item_id: UUID) -> BusinessFunction | None:
        row = self.db.get(BusinessFunction, item_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(self, page: int, page_size: int) -> tuple[list[BusinessFunction], int]:
        base = select(BusinessFunction).where(
            BusinessFunction.financial_entity_id == self.organization_id
        )
        total = (
            self.db.scalar(
                select(func.count(BusinessFunction.id)).where(
                    BusinessFunction.financial_entity_id == self.organization_id
                )
            )
            or 0
        )
        rows = self.db.scalars(
            base.order_by(BusinessFunction.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, row: BusinessFunction) -> BusinessFunction:
        row.financial_entity_id = self.organization_id
        self.db.add(row)
        self.db.flush()
        return row

    def delete(self, row: BusinessFunction) -> None:
        self.db.delete(row)
