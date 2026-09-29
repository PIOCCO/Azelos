import uuid

from pydantic import BaseModel


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
