import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums_config import ConfigAuditAction

config_audit_action_enum = pg_enum(ConfigAuditAction, "config_audit_action")


class ConfigurationAuditLog(Base):
    __tablename__ = "configuration_audit_log"
    __table_args__ = (
        Index("ix_configuration_audit_log_financial_entity_id", "financial_entity_id"),
        Index("ix_configuration_audit_log_created_at", "created_at"),
        Index("ix_configuration_audit_log_object", "object_type", "object_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(256), nullable=False)
    action: Mapped[ConfigAuditAction] = mapped_column(
        config_audit_action_enum, nullable=False
    )
    object_type: Mapped[str] = mapped_column(String(128), nullable=False)
    object_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    old_value: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    new_value: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
