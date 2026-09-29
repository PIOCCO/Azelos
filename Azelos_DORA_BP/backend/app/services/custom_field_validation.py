"""Server-side validation for custom field definitions and values."""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urlparse

from app.domain.entity_types import ALLOWED_ENTITY_TYPES
from app.models.enums_config import CustomFieldType

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
FIELD_KEY_RE = re.compile(r"^[a-z][a-z0-9_]{0,63}$")
MAX_JSON_BYTES = 16_384


class CustomFieldValidationError(ValueError):
    pass


def validate_field_key(field_key: str) -> None:
    if not FIELD_KEY_RE.match(field_key):
        raise CustomFieldValidationError(
            "field_key must be lowercase snake_case, 1-64 chars"
        )


def validate_entity_type(entity_type: str) -> None:
    if entity_type not in ALLOWED_ENTITY_TYPES:
        raise CustomFieldValidationError(f"entity_type not allowed: {entity_type}")


def validate_options_for_type(field_type: CustomFieldType, options: Any) -> None:
    if field_type in (CustomFieldType.SELECT, CustomFieldType.MULTI_SELECT):
        if not isinstance(options, list) or not options:
            raise CustomFieldValidationError("SELECT/MULTI_SELECT require non-empty options list")
        if not all(isinstance(o, str) for o in options):
            raise CustomFieldValidationError("options must be strings")
    elif options is not None:
        raise CustomFieldValidationError("options only allowed for SELECT types")


def validate_value(
    field_type: CustomFieldType,
    value: Any,
    *,
    required: bool,
    options: list[str] | None,
) -> Any:
    if value is None or value == "":
        if required:
            raise CustomFieldValidationError("required field missing value")
        return None

    if field_type == CustomFieldType.TEXT:
        if not isinstance(value, str) or len(value) > 512:
            raise CustomFieldValidationError("TEXT must be string max 512 chars")
        return value
    if field_type == CustomFieldType.LONG_TEXT:
        if not isinstance(value, str) or len(value) > 8000:
            raise CustomFieldValidationError("LONG_TEXT too long")
        return value
    if field_type == CustomFieldType.INTEGER:
        if isinstance(value, bool) or not isinstance(value, int):
            raise CustomFieldValidationError("INTEGER required")
        return value
    if field_type == CustomFieldType.DECIMAL:
        try:
            return str(Decimal(str(value)))
        except (InvalidOperation, ValueError) as exc:
            raise CustomFieldValidationError("DECIMAL invalid") from exc
    if field_type == CustomFieldType.BOOLEAN:
        if not isinstance(value, bool):
            raise CustomFieldValidationError("BOOLEAN required")
        return value
    if field_type == CustomFieldType.DATE:
        if isinstance(value, str):
            date.fromisoformat(value)
            return value
        raise CustomFieldValidationError("DATE must be ISO date string")
    if field_type == CustomFieldType.DATETIME:
        if isinstance(value, str):
            datetime.fromisoformat(value.replace("Z", "+00:00"))
            return value
        raise CustomFieldValidationError("DATETIME must be ISO datetime string")
    if field_type == CustomFieldType.EMAIL:
        if not isinstance(value, str) or not EMAIL_RE.match(value):
            raise CustomFieldValidationError("EMAIL invalid")
        return value
    if field_type == CustomFieldType.URL:
        if not isinstance(value, str):
            raise CustomFieldValidationError("URL must be string")
        parsed = urlparse(value)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise CustomFieldValidationError("URL invalid")
        return value
    if field_type == CustomFieldType.SELECT:
        if not isinstance(value, str) or options is None or value not in options:
            raise CustomFieldValidationError("SELECT value not in options")
        return value
    if field_type == CustomFieldType.MULTI_SELECT:
        if not isinstance(value, list) or options is None:
            raise CustomFieldValidationError("MULTI_SELECT must be list")
        for item in value:
            if item not in options:
                raise CustomFieldValidationError("MULTI_SELECT invalid option")
        return value
    if field_type == CustomFieldType.REFERENCE:
        if not isinstance(value, str) or len(value) > 128:
            raise CustomFieldValidationError("REFERENCE must be string id/key")
        return value
    raise CustomFieldValidationError(f"unsupported field type {field_type}")


def assert_json_size(payload: Any) -> None:
    import json

    if len(json.dumps(payload, default=str)) > MAX_JSON_BYTES:
        raise CustomFieldValidationError("payload too large")
