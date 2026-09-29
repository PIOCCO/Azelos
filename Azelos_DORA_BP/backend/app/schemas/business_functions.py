import uuid
from pydantic import BaseModel, Field

from app.models.enums import BusinessFunctionStatus, CriticalOrImportant


class BusinessFunctionCreate(BaseModel):
    name: str
    function_identifier: str = Field(max_length=128)
    description: str | None = None
    critical_or_important: CriticalOrImportant
    exit_strategy_required: bool = False


class BusinessFunctionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: BusinessFunctionStatus | None = None


class BusinessFunctionOut(BaseModel):
    id: uuid.UUID
    name: str
    function_identifier: str
    critical_or_important: CriticalOrImportant
    status: BusinessFunctionStatus

    model_config = {"from_attributes": True}
