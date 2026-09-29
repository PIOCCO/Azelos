from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.contract import Contract
from app.models.enums import ContractStatus
from app.models.provider import ICTProvider
from app.repositories.contracts import ContractRepository
from app.schemas.contracts import ContractCreate, ContractUpdate


class ContractService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = ContractRepository(db, organization_id)

    def list(self, page: int, page_size: int):
        return self.repo.list_paginated(page, page_size)

    def get(self, contract_id: UUID) -> Contract:
        row = self.repo.get(contract_id)
        if row is None:
            raise AppError("NOT_FOUND", "Contract not found", 404)
        return row

    def create(self, data: ContractCreate) -> Contract:
        provider = self.repo.db.get(ICTProvider, data.provider_id)
        if provider is None or provider.financial_entity_id != self.repo.organization_id:
            raise AppError("NOT_FOUND", "Provider not found", 404)
        return self.repo.create(
            Contract(
                provider_id=data.provider_id,
                reference_number=data.reference_number,
                contract_type=data.contract_type,
                start_date=data.start_date,
                end_date=data.end_date,
                status=ContractStatus.ACTIVE,
            )
        )

    def update(self, contract_id: UUID, data: ContractUpdate) -> Contract:
        row = self.get(contract_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        return row
