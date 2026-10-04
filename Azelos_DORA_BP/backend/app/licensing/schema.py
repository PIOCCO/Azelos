from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.licensing.enums import LicensePlan, LicenseStatus

LICENSE_FORMAT_VERSION = 1
REVOCATION_LIST_FORMAT_VERSION = 1


class LicensePayload(BaseModel):
    license_format_version: int = Field(default=LICENSE_FORMAT_VERSION)
    license_id: UUID
    organization_id: UUID
    customer_name: str = Field(min_length=1, max_length=256)
    plan: LicensePlan
    issued_at: datetime
    starts_at: datetime
    expires_at: datetime
    max_users: int = Field(ge=1, le=10_000)
    enabled_modules: list[str] | None = None
    license_status: LicenseStatus = LicenseStatus.ACTIVE
    product_version: str | None = Field(default=None, max_length=64)

    @field_validator("issued_at", "starts_at", "expires_at", mode="before")
    @classmethod
    def _parse_dt(cls, v: Any) -> Any:
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        return v

    @field_validator("expires_at")
    @classmethod
    def _expires_after_start(cls, v: datetime, info) -> datetime:
        starts = info.data.get("starts_at")
        if starts is not None and v <= starts:
            raise ValueError("expires_at must be after starts_at")
        return v


class LicenseEnvelope(BaseModel):
    format_version: int = Field(default=LICENSE_FORMAT_VERSION)
    payload: LicensePayload
    signature: str = Field(min_length=16)


class RevocationEntry(BaseModel):
    license_id: UUID
    revoked_at: datetime

    @field_validator("revoked_at", mode="before")
    @classmethod
    def _parse_dt(cls, v: Any) -> Any:
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        return v


class RevocationListEnvelope(BaseModel):
    format_version: int = Field(default=REVOCATION_LIST_FORMAT_VERSION)
    revocations: list[RevocationEntry]
    signature: str = Field(min_length=16)
