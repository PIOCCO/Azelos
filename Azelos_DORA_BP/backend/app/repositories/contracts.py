from uuid import UUID

from sqlalchemy import func, select

from app.models.contract import Contract
from app.repositories.base import OrgScopedRepository


class ContractRepository(OrgScopedRepository):
    def get(self, contract_id: UUID) -> Contract | None:
        row = self.db.get(Contract, contract_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(self, page: int, page_size: int) -> tuple[list[Contract], int]:
        total = (
            self.db.scalar(
                select(func.count(Contract.id)).where(
                    Contract.financial_entity_id == self.organization_id
                )
            )
            or 0
        )
        rows = self.db.scalars(
            select(Contract)
            .where(Contract.financial_entity_id == self.organization_id)
            .order_by(Contract.reference_number)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, row: Contract) -> Contract:
        row.financial_entity_id = self.organization_id
        self.db.add(row)
        self.db.flush()
        return row
