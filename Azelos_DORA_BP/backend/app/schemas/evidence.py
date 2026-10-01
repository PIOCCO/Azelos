import uuid
from datetime import date, datetime

from pydantic import BaseModel


class DocumentTypeOut(BaseModel):
    id: uuid.UUID
    code: str
    label: str

    model_config = {"from_attributes": True}


class EvidenceOut(BaseModel):
    id: uuid.UUID
    file_name: str
    document_type_id: uuid.UUID
    storage_provider: str
    storage_object_key: str
    content_hash: str
    content_type: str | None
    size_bytes: int | None
    issue_date: date | None
    expiry_date: date | None
    uploaded_at: datetime

    model_config = {"from_attributes": True}
