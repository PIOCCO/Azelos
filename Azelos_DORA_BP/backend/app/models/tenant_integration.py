"""Per-tenant external system connections (hosted SaaS configuration)."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, LargeBinary, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.enums_integrations import IntegrationStatus, IntegrationType
from app.models.mixins import TimestampMixin


class TenantIntegration(Base, TimestampMixin):
    """Tenant-scoped integration metadata; secrets stored encrypted separately."""

    __tablename__ = "tenant_integrations"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id",
            "integration_type",
            "name",
            name="uq_tenant_integration_name",
        ),
        Index("ix_tenant_integrations_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    integration_type: Mapped[IntegrationType] = mapped_column(
        String(32), nullable=False
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[IntegrationStatus] = mapped_column(
        String(32), nullable=False, default=IntegrationStatus.NOT_CONFIGURED
    )
    config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    secrets_encrypted: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    last_test_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_test_success: Mapped[bool | None] = mapped_column(default=None)
    last_test_message: Mapped[str | None] = mapped_column(Text)
    disabled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
