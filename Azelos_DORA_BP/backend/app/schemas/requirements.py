import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RegulatoryRequirementOut(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    description: str | None

    model_config = {"from_attributes": True}


class RequirementEvidenceFileOut(BaseModel):
    link_id: uuid.UUID
    evidence_id: uuid.UUID
    file_name: str
    uploaded_at: datetime


class OrganizationRequirementDetailOut(BaseModel):
    id: uuid.UUID
    dora_requirement_id: uuid.UUID
    code: str
    title: str
    applicable: bool
    implementation_status: str
    owner: str | None
    notes: str | None
    evidence_files: list[RequirementEvidenceFileOut] = Field(default_factory=list)


class OrganizationRequirementUpdate(BaseModel):
    applicable: bool | None = None
    implementation_status: str | None = Field(default=None, max_length=64)
    owner: str | None = Field(default=None, max_length=256)
    notes: str | None = None
