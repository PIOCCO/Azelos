from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.business_function import BusinessFunction
from app.models.enums import CriticalOrImportant
from app.models.ict_assets import AssetFunctionMap, ICTAsset
from app.repositories.ict_assets import ICTAssetRepository
from app.schemas.ict_assets import AssetFunctionMapCreate, ICTAssetCreate, ICTAssetUpdate


class ICTAssetService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id
        self.repo = ICTAssetRepository(db, organization_id)

    def list(self, page: int, page_size: int):
        return self.repo.list_paginated(page, page_size)

    def get(self, asset_id: UUID) -> ICTAsset:
        row = self.repo.get(asset_id)
        if row is None:
            raise AppError("NOT_FOUND", "ICT asset not found", 404)
        return row

    def create(self, data: ICTAssetCreate) -> ICTAsset:
        return self.repo.create(
            ICTAsset(
                name=data.name,
                asset_identifier=data.asset_identifier,
                description=data.description,
                information_asset_id=data.information_asset_id,
                inherent_criticality=data.inherent_criticality,
            )
        )

    def update(self, asset_id: UUID, data: ICTAssetUpdate) -> ICTAsset:
        row = self.get(asset_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        return row

    def map_to_function(self, data: AssetFunctionMapCreate) -> AssetFunctionMap:
        fn = self.db.get(BusinessFunction, data.function_id)
        if fn is None or fn.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Business function not found", 404)
        asset = self.get(data.ict_asset_id)
        supports = data.supports_critical_function
        if fn.critical_or_important in (
            CriticalOrImportant.CRITICAL,
            CriticalOrImportant.IMPORTANT,
        ):
            supports = True
        row = AssetFunctionMap(
            function_id=fn.id,
            ict_asset_id=asset.id,
            supports_critical_function=supports,
        )
        self.db.add(row)
        self.db.flush()
        # Never mutate asset.inherent_criticality here
        return row
