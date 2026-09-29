import uuid

from pydantic import BaseModel, Field


class InformationAssetCreate(BaseModel):
    name: str
    asset_identifier: str = Field(max_length=128)
    description: str | None = None


class InformationAssetOut(BaseModel):
    id: uuid.UUID
    name: str
    asset_identifier: str
    description: str | None

    model_config = {"from_attributes": True}
