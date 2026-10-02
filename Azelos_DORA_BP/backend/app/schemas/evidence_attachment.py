import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EvidenceAttachmentOut(BaseModel):
    """PDF evidence linked to a DORA record (direct FK or join table)."""

    link_id: uuid.UUID | None = None
    evidence_id: uuid.UUID
    file_name: str
    uploaded_at: datetime


class EvidenceAttachmentsGrouped(BaseModel):
    entity_type: str
    items: dict[str, list[EvidenceAttachmentOut]] = Field(default_factory=dict)
