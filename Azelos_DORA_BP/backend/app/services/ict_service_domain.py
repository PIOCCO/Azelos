from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.service import ICTService
from app.repositories.contracts import ContractRepository
from app.repositories.ict_services import ICTServiceRepository
from app.schemas.ict_services import ICTServiceCreate, ICTServiceUpdate


class ICTServiceDomainService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = ICTServiceRepository(db, organization_id)
        self.contracts = ContractRepository(db, organization_id)

    def list(self, page: int, page_size: int):
        return self.repo.list_paginated(page, page_size)

    def get(self, service_id: UUID) -> ICTService:
        row = self.repo.get(service_id)
        if row is None:
            raise AppError("NOT_FOUND", "ICT service not found", 404)
        return row

    def create(self, data: ICTServiceCreate) -> ICTService:
        contract = self.contracts.get(data.contract_id)
        if contract is None:
            raise AppError("NOT_FOUND", "Contract not found", 404)
        return self.repo.create(
            ICTService(
                contract_id=data.contract_id,
                name=data.name,
                description=data.description,
                supports_critical_or_important=data.supports_critical_or_important,
            )
        )

    def update(self, service_id: UUID, data: ICTServiceUpdate) -> ICTService:
        row = self.get(service_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        return row
