import uuid

from pydantic import BaseModel, Field

from app.schemas.evidence_attachment import EvidenceAttachmentOut


class SupplierCreate(BaseModel):
    legal_name: str
    trading_name: str | None = None
    lei: str | None = Field(default=None, max_length=20)
    country_code: str = Field(min_length=2, max_length=2)


class SupplierUpdate(BaseModel):
    legal_name: str | None = None
    trading_name: str | None = None
    status: str | None = None


class SupplierOut(BaseModel):
    id: uuid.UUID
    legal_name: str
    trading_name: str | None
    lei: str | None
    country_code: str
    evidence_files: list[EvidenceAttachmentOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}
