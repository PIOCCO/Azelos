from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.ict_assets import InformationAsset
from app.repositories.information_assets import InformationAssetRepository
from app.schemas.information_assets import InformationAssetCreate


class InformationAssetService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = InformationAssetRepository(db, organization_id)

    def list(self, page: int, page_size: int):
        return self.repo.list_paginated(page, page_size)

    def get(self, asset_id: UUID) -> InformationAsset:
        row = self.repo.get(asset_id)
        if row is None:
            raise AppError("NOT_FOUND", "Information asset not found", 404)
        return row

    def create(self, data: InformationAssetCreate) -> InformationAsset:
        return self.repo.create(
            InformationAsset(
                name=data.name,
                asset_identifier=data.asset_identifier,
                description=data.description,
            )
        )
