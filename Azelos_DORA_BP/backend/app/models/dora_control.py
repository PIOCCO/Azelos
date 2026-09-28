import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import ComplianceStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.contract import Contract
    from app.models.evidence import Evidence

compliance_status_enum = pg_enum(ComplianceStatus, "compliance_status")


class DoraControlDefinition(Base):
    """Reference catalogue of contractual DORA control themes (not RoI templates)."""

    __tablename__ = "dora_control_definitions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    category: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class ContractDoraControl(Base, TimestampMixin):
    """Per-contract control assessment — human review required for final compliance."""

    __tablename__ = "contract_dora_controls"
    __table_args__ = (
        UniqueConstraint(
            "contract_id", "control_definition_id", name="uq_contract_control"
        ),
        ForeignKeyConstraint(
            ["contract_id", "financial_entity_id"],
            ["contracts.id", "contracts.financial_entity_id"],
            name="fk_contract_control_same_entity",
            ondelete="CASCADE",
        ),
        Index("ix_contract_dora_controls_contract_id", "contract_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    control_definition_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dora_control_definitions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    compliance_status: Mapped[ComplianceStatus] = mapped_column(
        compliance_status_enum,
        nullable=False,
        default=ComplianceStatus.NOT_ASSESSED,
    )
    assessed_by: Mapped[str | None] = mapped_column(String(256))
    approved_by: Mapped[str | None] = mapped_column(String(256))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    ai_suggested_status: Mapped[ComplianceStatus | None] = mapped_column(
        compliance_status_enum
    )

    contract: Mapped["Contract"] = relationship(back_populates="dora_controls")
    control_definition: Mapped[DoraControlDefinition] = relationship()
    evidence_links: Mapped[list["EvidenceControlLink"]] = relationship(
        back_populates="contract_control"
    )


class EvidenceControlLink(Base):
    __tablename__ = "evidence_control_links"
    __table_args__ = (
        UniqueConstraint(
            "evidence_id", "contract_control_id", name="uq_evidence_control"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    evidence_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evidence.id", ondelete="CASCADE"),
        nullable=False,
    )
    contract_control_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contract_dora_controls.id", ondelete="CASCADE"),
        nullable=False,
    )
    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    evidence: Mapped["Evidence"] = relationship(back_populates="control_links")
    contract_control: Mapped[ContractDoraControl] = relationship(
        back_populates="evidence_links"
    )
