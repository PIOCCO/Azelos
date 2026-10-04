import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.mixins import TimestampMixin
from app.licensing.enums import LicensePlan, LicenseStatus

license_plan_enum = pg_enum(LicensePlan, "license_plan")
license_status_enum = pg_enum(LicenseStatus, "license_status")


class OrganizationLicense(Base, TimestampMixin):
    """Verified license installed for a tenant (customer-hosted deployment)."""

    __tablename__ = "organization_licenses"
    __table_args__ = (
        UniqueConstraint("financial_entity_id", name="uq_org_license_entity"),
        UniqueConstraint("license_id", name="uq_org_license_license_id"),
        Index("ix_org_licenses_expires_at", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    license_id: Mapped[str] = mapped_column(String(36), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(256), nullable=False)
    plan: Mapped[LicensePlan] = mapped_column(license_plan_enum, nullable=False)
    license_status: Mapped[LicenseStatus] = mapped_column(
        license_status_enum, nullable=False, default=LicenseStatus.ACTIVE
    )
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_users: Mapped[int] = mapped_column(Integer, nullable=False)
    enabled_modules: Mapped[list | None] = mapped_column(JSONB)
    product_version: Mapped[str | None] = mapped_column(String(64))
    envelope_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    installed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    installed_by: Mapped[str | None] = mapped_column(String(320))
    last_validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
