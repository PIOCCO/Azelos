import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import SubcontractorStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.provider import ICTProvider

subcontractor_status_enum = pg_enum(SubcontractorStatus, "subcontractor_status")


class Subcontractor(Base, TimestampMixin):
    """Nth-party chain under an ICT provider (recursive via parent_subcontractor_id)."""

    __tablename__ = "subcontractors"
    __table_args__ = (
        CheckConstraint(
            "lei IS NULL OR (char_length(lei) = 20 AND lei ~ '^[A-Z0-9]{20}$')",
            name="ck_subcontractor_lei_format",
        ),
        CheckConstraint(
            "country_code ~ '^[A-Z]{2}$'",
            name="ck_subcontractor_country_iso2",
        ),
        CheckConstraint(
            "(parent_subcontractor_id IS NULL AND depth_rank = 0) OR "
            "(parent_subcontractor_id IS NOT NULL AND depth_rank > 0)",
            name="ck_subcontractor_depth_consistency",
        ),
        ForeignKeyConstraint(
            ["provider_id", "financial_entity_id"],
            ["ict_providers.id", "ict_providers.financial_entity_id"],
            name="fk_subcontractor_provider_same_entity",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["parent_subcontractor_id", "provider_id"],
            ["subcontractors.id", "subcontractors.provider_id"],
            name="fk_subcontractor_parent_same_provider",
            ondelete="CASCADE",
        ),
        UniqueConstraint("id", "provider_id", name="uq_subcontractor_id_provider"),
        Index("ix_subcontractors_provider_id", "provider_id"),
        Index("ix_subcontractors_parent_id", "parent_subcontractor_id"),
        Index("ix_subcontractors_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    provider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    parent_subcontractor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    legal_name: Mapped[str] = mapped_column(String(512), nullable=False)
    lei: Mapped[str | None] = mapped_column(String(20))
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    service_description: Mapped[str | None] = mapped_column(Text)
    processing_location: Mapped[str | None] = mapped_column(String(256))
    depth_rank: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[SubcontractorStatus] = mapped_column(
        subcontractor_status_enum, nullable=False, default=SubcontractorStatus.ACTIVE
    )

    provider: Mapped["ICTProvider"] = relationship(
        back_populates="subcontractors", foreign_keys=[provider_id]
    )
    parent: Mapped["Subcontractor | None"] = relationship(
        remote_side="Subcontractor.id",
        back_populates="children",
        foreign_keys=[parent_subcontractor_id],
    )
    children: Mapped[list["Subcontractor"]] = relationship(
        back_populates="parent", foreign_keys=[parent_subcontractor_id]
    )
