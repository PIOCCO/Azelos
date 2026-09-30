import uuid

from pydantic import BaseModel, Field


class RegulatoryRequirementOut(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    description: str | None

    model_config = {"from_attributes": True}


class OrganizationRequirementDetailOut(BaseModel):
    id: uuid.UUID
    dora_requirement_id: uuid.UUID
    code: str
    title: str
    applicable: bool
    implementation_status: str
    owner: str | None
    notes: str | None


class OrganizationRequirementUpdate(BaseModel):
    applicable: bool | None = None
    implementation_status: str | None = Field(default=None, max_length=64)
    owner: str | None = Field(default=None, max_length=256)
    notes: str | None = None
