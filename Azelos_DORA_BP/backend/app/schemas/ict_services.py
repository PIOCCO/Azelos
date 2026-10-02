import uuid

from pydantic import BaseModel, Field

from app.models.enums import CriticalOrImportant, ServiceStatus
from app.schemas.evidence_attachment import EvidenceAttachmentOut


class ICTServiceCreate(BaseModel):
    contract_id: uuid.UUID
    name: str
    description: str | None = None
    supports_critical_or_important: CriticalOrImportant = CriticalOrImportant.NEITHER


class ICTServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: ServiceStatus | None = None


class ICTServiceOut(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    name: str
    status: ServiceStatus
    supports_critical_or_important: CriticalOrImportant
    evidence_files: list[EvidenceAttachmentOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}
