import uuid

from pydantic import BaseModel, Field

from app.models.enums import SubcontractorStatus


class SubcontractorCreate(BaseModel):
    provider_id: uuid.UUID
    legal_name: str
    country_code: str = Field(min_length=2, max_length=2)
    lei: str | None = None
    service_description: str | None = None
    parent_subcontractor_id: uuid.UUID | None = None


class SubcontractorUpdate(BaseModel):
    legal_name: str | None = None
    status: SubcontractorStatus | None = None
    service_description: str | None = None


class SubcontractorOut(BaseModel):
    id: uuid.UUID
    provider_id: uuid.UUID
    legal_name: str
    country_code: str
    depth_rank: int
    status: SubcontractorStatus

    model_config = {"from_attributes": True}
