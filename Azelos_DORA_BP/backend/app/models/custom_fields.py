import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums_config import CustomFieldType
from app.models.mixins import TimestampMixin

custom_field_type_enum = pg_enum(CustomFieldType, "custom_field_type")


class CustomFieldDefinition(Base, TimestampMixin):
    __tablename__ = "custom_field_definitions"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id",
            "entity_type",
            "field_key",
            name="uq_custom_field_key_per_org_entity",
        ),
        Index("ix_custom_field_definitions_financial_entity_id", "financial_entity_id"),
        Index("ix_custom_field_definitions_entity_type", "entity_type"),
        Index("ix_custom_field_definitions_active", "active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    field_key: Mapped[str] = mapped_column(String(64), nullable=False)
    display_name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    field_type: Mapped[CustomFieldType] = mapped_column(
        custom_field_type_enum, nullable=False
    )
    required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_value: Mapped[Any | None] = mapped_column(JSONB)
    validation_rules: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    options: Mapped[list[Any] | None] = mapped_column(JSONB)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    values: Mapped[list["CustomFieldValue"]] = relationship(back_populates="definition")


class CustomFieldValue(Base, TimestampMixin):
    __tablename__ = "custom_field_values"
    __table_args__ = (
        UniqueConstraint(
            "field_definition_id",
            "entity_type",
            "entity_id",
            name="uq_custom_field_value_entity",
        ),
        Index("ix_custom_field_values_financial_entity_id", "financial_entity_id"),
        Index("ix_custom_field_values_entity", "entity_type", "entity_id"),
        Index("ix_custom_field_values_field_definition_id", "field_definition_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    field_definition_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("custom_field_definitions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    value: Mapped[Any | None] = mapped_column(JSONB)

    definition: Mapped[CustomFieldDefinition] = relationship(back_populates="values")
