from uuid import UUID

from sqlalchemy import func, select

from app.models.provider import ICTProvider
from app.repositories.base import OrgScopedRepository


class SupplierRepository(OrgScopedRepository):
    def get(self, supplier_id: UUID) -> ICTProvider | None:
        row = self.db.get(ICTProvider, supplier_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(self, page: int, page_size: int) -> tuple[list[ICTProvider], int]:
        base = select(ICTProvider).where(
            ICTProvider.financial_entity_id == self.organization_id
        )
        total = (
            self.db.scalar(
                select(func.count(ICTProvider.id)).where(
                    ICTProvider.financial_entity_id == self.organization_id
                )
            )
            or 0
        )
        rows = self.db.scalars(
            base.order_by(ICTProvider.legal_name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, provider: ICTProvider) -> ICTProvider:
        provider.financial_entity_id = self.organization_id
        self.db.add(provider)
        self.db.flush()
        return provider
