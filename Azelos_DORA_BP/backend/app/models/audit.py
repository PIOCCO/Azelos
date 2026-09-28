import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import AuditAction

audit_action_enum = pg_enum(AuditAction, "audit_action")


class AuditRecord(Base):
    __tablename__ = "audit_records"
    __table_args__ = (
        Index("ix_audit_records_entity", "entity_type", "entity_id"),
        Index("ix_audit_records_financial_entity_id", "financial_entity_id"),
        Index("ix_audit_records_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    actor: Mapped[str] = mapped_column(String(256), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[AuditAction] = mapped_column(audit_action_enum, nullable=False)
    old_value: Mapped[dict | None] = mapped_column(JSONB)
    new_value: Mapped[dict | None] = mapped_column(JSONB)
    correlation_id: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)
