from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.enums import SubcontractorStatus
from app.models.provider import ICTProvider
from app.models.subcontractor import Subcontractor
from app.repositories.subcontractors import SubcontractorRepository
from app.schemas.subcontractors import SubcontractorCreate


class SubcontractorService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = SubcontractorRepository(db, organization_id)

    def list(self, page: int, page_size: int):
        return self.repo.list_paginated(page, page_size)

    def get(self, row_id: UUID) -> Subcontractor:
        row = self.repo.get(row_id)
        if row is None:
            raise AppError("NOT_FOUND", "Subcontractor not found", 404)
        return row

    def create(self, data: SubcontractorCreate) -> Subcontractor:
        provider = self.repo.db.get(ICTProvider, data.provider_id)
        if provider is None or provider.financial_entity_id != self.repo.organization_id:
            raise AppError("NOT_FOUND", "Provider not found", 404)
        depth = 0
        if data.parent_subcontractor_id:
            parent = self.get(data.parent_subcontractor_id)
            if parent.provider_id != data.provider_id:
                raise AppError("VALIDATION_ERROR", "Parent must belong to same provider", 400)
            depth = parent.depth_rank + 1
        return self.repo.create(
            Subcontractor(
                provider_id=data.provider_id,
                legal_name=data.legal_name,
                country_code=data.country_code.upper(),
                lei=data.lei,
                service_description=data.service_description,
                parent_subcontractor_id=data.parent_subcontractor_id,
                depth_rank=depth,
                status=SubcontractorStatus.ACTIVE,
            )
        )
