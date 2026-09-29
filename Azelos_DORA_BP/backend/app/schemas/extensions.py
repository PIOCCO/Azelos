import uuid
from pydantic import BaseModel


class ExtensionCreate(BaseModel):
    name: str
    description: str | None = None
    version: str | None = None
    owner: str | None = None
    resource_type: str | None = None


class ExtensionUpdate(BaseModel):
    description: str | None = None
    version: str | None = None
    status: str | None = None


class ExtensionOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    version: str | None
    owner: str | None
    status: str
    resource_type: str | None

    model_config = {"from_attributes": True}
