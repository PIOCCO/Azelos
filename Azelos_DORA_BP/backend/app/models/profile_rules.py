"""Declarative applicability rules (dora_config)."""

import uuid
from typing import Any

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.schemas_pg import DORA_CONFIG_SCHEMA
from app.database.base import Base
from app.models.mixins import TimestampMixin


class ProfileRule(Base, TimestampMixin):
    """
    When `conditions` match an organization profile (and optional context),
    merge `outcomes` into applicability (flags, module keys, requirement hints).
    """

    __tablename__ = "profile_rules"
    __table_args__ = {"schema": DORA_CONFIG_SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    rule_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    conditions: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    outcomes: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    system_defined: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
