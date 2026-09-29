import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.financial_entity import FinancialEntity


class DoraDomain(Base):
    """Immutable regulatory baseline — system-managed."""

    __tablename__ = "dora_domains"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    requirements: Mapped[list["DoraRequirement"]] = relationship(
        back_populates="domain"
    )


class DoraRequirement(Base):
    """Immutable DORA requirement baseline row."""

    __tablename__ = "dora_requirements"
    __table_args__ = (
        UniqueConstraint("code", name="uq_dora_requirement_code"),
        Index("ix_dora_requirements_domain_id", "domain_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    domain_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dora_domains.id", ondelete="RESTRICT"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    system_immutable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    domain: Mapped[DoraDomain] = relationship(back_populates="requirements")
    organization_links: Mapped[list["OrganizationRequirement"]] = relationship(
        back_populates="requirement"
    )


class OrganizationRequirement(Base, TimestampMixin):
    """Organization implementation / applicability of a baseline requirement."""

    __tablename__ = "organization_requirements"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id",
            "dora_requirement_id",
            name="uq_org_requirement",
        ),
        Index("ix_organization_requirements_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    dora_requirement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dora_requirements.id", ondelete="RESTRICT"),
        nullable=False,
    )
    applicable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    implementation_status: Mapped[str] = mapped_column(
        String(64), default="not_started", nullable=False
    )
    owner: Mapped[str | None] = mapped_column(String(256))
    notes: Mapped[str | None] = mapped_column(Text)

    financial_entity: Mapped["FinancialEntity"] = relationship()
    requirement: Mapped[DoraRequirement] = relationship(
        back_populates="organization_links"
    )
