import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums_profile import (
    OrganizationSizeCategory,
    OrganizationType,
    RegulatoryStatus,
)
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.financial_entity import FinancialEntity

organization_type_enum = pg_enum(OrganizationType, "organization_type")
organization_size_enum = pg_enum(OrganizationSizeCategory, "organization_size_category")
regulatory_status_enum = pg_enum(RegulatoryStatus, "regulatory_status")


class OrganizationProfile(Base, TimestampMixin):
    """Enterprise type / regulatory posture — one profile per organization (tenant)."""

    __tablename__ = "organization_profiles"
    __table_args__ = (Index("ix_organization_profiles_financial_entity_id", "financial_entity_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    organization_type: Mapped[OrganizationType] = mapped_column(
        organization_type_enum,
        nullable=False,
        default=OrganizationType.CREDIT_INSTITUTION,
    )
    size_category: Mapped[OrganizationSizeCategory] = mapped_column(
        organization_size_enum,
        nullable=False,
        default=OrganizationSizeCategory.MEDIUM,
    )
    regulatory_status: Mapped[RegulatoryStatus] = mapped_column(
        regulatory_status_enum,
        nullable=False,
        default=RegulatoryStatus.AUTHORIZED,
    )
    art16_eligible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_critical_functions: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tlpt_applicable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    financial_entity: Mapped["FinancialEntity"] = relationship(back_populates="profile")
