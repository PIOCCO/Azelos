from uuid import UUID

from sqlalchemy import func, select

from app.models.ict_assets import ICTAsset
from app.repositories.base import OrgScopedRepository


class ICTAssetRepository(OrgScopedRepository):
    def get(self, asset_id: UUID) -> ICTAsset | None:
        row = self.db.get(ICTAsset, asset_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(self, page: int, page_size: int) -> tuple[list[ICTAsset], int]:
        total = (
            self.db.scalar(
                select(func.count(ICTAsset.id)).where(
                    ICTAsset.financial_entity_id == self.organization_id
                )
            )
            or 0
        )
        rows = self.db.scalars(
            select(ICTAsset)
            .where(ICTAsset.financial_entity_id == self.organization_id)
            .order_by(ICTAsset.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, row: ICTAsset) -> ICTAsset:
        row.financial_entity_id = self.organization_id
        self.db.add(row)
        self.db.flush()
        return row
