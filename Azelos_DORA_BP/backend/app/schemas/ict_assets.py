import uuid

from pydantic import BaseModel, Field

from app.models.enums import CriticalOrImportant


class ICTAssetCreate(BaseModel):
    name: str
    asset_identifier: str = Field(max_length=128)
    description: str | None = None
    information_asset_id: uuid.UUID | None = None
    inherent_criticality: CriticalOrImportant = CriticalOrImportant.NEITHER


class ICTAssetUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    inherent_criticality: CriticalOrImportant | None = None


class ICTAssetOut(BaseModel):
    id: uuid.UUID
    name: str
    asset_identifier: str
    inherent_criticality: CriticalOrImportant
    information_asset_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class AssetFunctionMapCreate(BaseModel):
    function_id: uuid.UUID
    ict_asset_id: uuid.UUID
    supports_critical_function: bool = False


class AssetFunctionMapOut(BaseModel):
    id: uuid.UUID
    function_id: uuid.UUID
    ict_asset_id: uuid.UUID
    supports_critical_function: bool

    model_config = {"from_attributes": True}
