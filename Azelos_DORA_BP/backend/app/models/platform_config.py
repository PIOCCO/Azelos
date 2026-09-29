import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.financial_entity import FinancialEntity


class PlatformModule(Base, TimestampMixin):
    """System-defined module catalogue (immutable keys)."""

    __tablename__ = "platform_modules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    system_defined: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization_assignments: Mapped[list["OrganizationModule"]] = relationship(
        back_populates="module"
    )


class OrganizationModule(Base, TimestampMixin):
    __tablename__ = "organization_modules"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id", "platform_module_id", name="uq_org_module"
        ),
        Index("ix_organization_modules_financial_entity_id", "financial_entity_id"),
        Index("ix_organization_modules_enabled", "enabled"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform_module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_modules.id", ondelete="RESTRICT"),
        nullable=False,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    financial_entity: Mapped["FinancialEntity"] = relationship()
    module: Mapped[PlatformModule] = relationship(back_populates="organization_assignments")


class OrganizationSetting(Base, TimestampMixin):
    __tablename__ = "organization_settings"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id", "setting_key", name="uq_org_setting_key"
        ),
        Index("ix_organization_settings_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    setting_key: Mapped[str] = mapped_column(String(128), nullable=False)
    value: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
