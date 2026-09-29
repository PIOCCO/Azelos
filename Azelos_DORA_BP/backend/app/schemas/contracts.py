import uuid
from datetime import date

from pydantic import BaseModel, Field

from app.models.enums import ContractStatus, ContractType


class ContractCreate(BaseModel):
    provider_id: uuid.UUID
    reference_number: str = Field(max_length=128)
    contract_type: ContractType = ContractType.OUTSOURCING
    start_date: date
    end_date: date | None = None


class ContractUpdate(BaseModel):
    status: ContractStatus | None = None
    end_date: date | None = None
    governing_law: str | None = None


class ContractOut(BaseModel):
    id: uuid.UUID
    provider_id: uuid.UUID
    reference_number: str
    contract_type: ContractType
    status: ContractStatus
    start_date: date
    end_date: date | None

    model_config = {"from_attributes": True}
