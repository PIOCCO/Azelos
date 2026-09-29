from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.enums import ProviderStatus, ProviderType
from app.models.provider import ICTProvider
from app.repositories.suppliers import SupplierRepository
from app.schemas.suppliers import SupplierCreate, SupplierUpdate


class SupplierService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = SupplierRepository(db, organization_id)

    def list(self, page: int, page_size: int):
        return self.repo.list_paginated(page, page_size)

    def get(self, supplier_id: UUID) -> ICTProvider:
        row = self.repo.get(supplier_id)
        if row is None:
            raise AppError("NOT_FOUND", "Supplier not found", 404)
        return row

    def create(self, data: SupplierCreate) -> ICTProvider:
        return self.repo.create(
            ICTProvider(
                legal_name=data.legal_name,
                trading_name=data.trading_name,
                lei=data.lei,
                country_code=data.country_code.upper(),
                provider_type=ProviderType.ICT_THIRD_PARTY,
                status=ProviderStatus.ACTIVE,
            )
        )

    def update(self, supplier_id: UUID, data: SupplierUpdate) -> ICTProvider:
        row = self.get(supplier_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        return row
