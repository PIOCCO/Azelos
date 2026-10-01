from uuid import UUID

from sqlalchemy import func, or_, select

from app.models.provider import ICTProvider
from app.repositories.base import OrgScopedRepository


class SupplierRepository(OrgScopedRepository):
    def get(self, supplier_id: UUID) -> ICTProvider | None:
        row = self.db.get(ICTProvider, supplier_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(
        self, page: int, page_size: int, *, q: str | None = None
    ) -> tuple[list[ICTProvider], int]:
        base = select(ICTProvider).where(
            ICTProvider.financial_entity_id == self.organization_id
        )
        if q:
            term = f"%{q.strip()}%"
            base = base.where(
                or_(
                    ICTProvider.legal_name.ilike(term),
                    ICTProvider.trading_name.ilike(term),
                    ICTProvider.lei.ilike(term),
                )
            )
        total = self.db.scalar(select(func.count()).select_from(base.subquery())) or 0
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
