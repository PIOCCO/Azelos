from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.business_function import BusinessFunction
from app.models.enums import BusinessFunctionStatus
from app.repositories.business_functions import BusinessFunctionRepository
from app.schemas.business_functions import BusinessFunctionCreate, BusinessFunctionUpdate


class BusinessFunctionService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = BusinessFunctionRepository(db, organization_id)

    def list(self, page: int, page_size: int):
        return self.repo.list_paginated(page, page_size)

    def get(self, item_id: UUID) -> BusinessFunction:
        row = self.repo.get(item_id)
        if row is None:
            raise AppError("NOT_FOUND", "Business function not found", 404)
        return row

    def create(self, data: BusinessFunctionCreate) -> BusinessFunction:
        return self.repo.create(
            BusinessFunction(
                name=data.name,
                function_identifier=data.function_identifier,
                description=data.description,
                critical_or_important=data.critical_or_important,
                exit_strategy_required=data.exit_strategy_required,
                status=BusinessFunctionStatus.ACTIVE,
            )
        )

    def update(self, item_id: UUID, data: BusinessFunctionUpdate) -> BusinessFunction:
        row = self.get(item_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        return row

    def delete(self, item_id: UUID) -> None:
        row = self.get(item_id)
        self.repo.delete(row)
