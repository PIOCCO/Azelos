from uuid import UUID

from sqlalchemy import func, select

from app.models.ict_assets import InformationAsset
from app.repositories.base import OrgScopedRepository


class InformationAssetRepository(OrgScopedRepository):
    def get(self, asset_id: UUID) -> InformationAsset | None:
        row = self.db.get(InformationAsset, asset_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(self, page: int, page_size: int) -> tuple[list[InformationAsset], int]:
        total = (
            self.db.scalar(
                select(func.count(InformationAsset.id)).where(
                    InformationAsset.financial_entity_id == self.organization_id
                )
            )
            or 0
        )
        rows = self.db.scalars(
            select(InformationAsset)
            .where(InformationAsset.financial_entity_id == self.organization_id)
            .order_by(InformationAsset.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, row: InformationAsset) -> InformationAsset:
        row.financial_entity_id = self.organization_id
        self.db.add(row)
        self.db.flush()
        return row
