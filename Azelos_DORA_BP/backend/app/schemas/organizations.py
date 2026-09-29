import uuid
from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    legal_name: str
    short_name: str | None = None
    country_code: str = Field(min_length=2, max_length=2)
    lei: str | None = None


class OrganizationUpdate(BaseModel):
    legal_name: str | None = None
    short_name: str | None = None
    status: str | None = None


class OrganizationOut(BaseModel):
    id: uuid.UUID
    legal_name: str
    short_name: str | None
    country_code: str
    lei: str | None
    status: str

    model_config = {"from_attributes": True}
