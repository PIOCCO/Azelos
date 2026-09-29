from __future__ import annotations

import uuid
from typing import Any

from pydantic import BaseModel, Field


class ModuleOut(BaseModel):
    key: str
    name: str
    description: str | None
    enabled: bool


class CustomFieldCreate(BaseModel):
    entity_type: str
    field_key: str = Field(max_length=64)
    display_name: str
    description: str | None = None
    field_type: str
    required: bool = False
    default_value: Any | None = None
    validation_rules: dict[str, Any] | None = None
    options: list[str] | None = None
    display_order: int = 0


class CustomFieldPatch(BaseModel):
    display_name: str | None = None
    description: str | None = None
    required: bool | None = None
    default_value: Any | None = None
    validation_rules: dict[str, Any] | None = None
    options: list[str] | None = None
    display_order: int | None = None
    active: bool | None = None


class CustomFieldOut(BaseModel):
    id: uuid.UUID
    entity_type: str
    field_key: str
    display_name: str
    field_type: str
    required: bool
    options: list[str] | None
    active: bool

    model_config = {"from_attributes": True}


class CustomFieldValueIn(BaseModel):
    entity_type: str
    entity_id: uuid.UUID
    field_key: str
    value: Any


class EntityCustomFieldsOut(BaseModel):
    id: uuid.UUID
    standard_fields: dict[str, Any]
    custom_fields: dict[str, Any]
