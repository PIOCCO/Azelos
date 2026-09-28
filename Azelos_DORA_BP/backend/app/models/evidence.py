import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import VerificationStatus

if TYPE_CHECKING:
    from app.models.contract import Contract
    from app.models.dora_control import EvidenceControlLink
    from app.models.financial_entity import FinancialEntity
    from app.models.provider import ICTProvider

verification_status_enum = pg_enum(VerificationStatus, "verification_status")


class DocumentType(Base):
    __tablename__ = "document_types"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(256), nullable=False)


class Evidence(Base):
    __tablename__ = "evidence"
    __table_args__ = (
        ForeignKeyConstraint(
            ["provider_id", "financial_entity_id"],
            ["ict_providers.id", "ict_providers.financial_entity_id"],
            name="fk_evidence_provider_same_entity",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["contract_id", "financial_entity_id"],
            ["contracts.id", "contracts.financial_entity_id"],
            name="fk_evidence_contract_same_entity",
            ondelete="RESTRICT",
        ),
        Index("ix_evidence_financial_entity_id", "financial_entity_id"),
        Index("ix_evidence_expiry_date", "expiry_date"),
        Index("ix_evidence_provider_id", "provider_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    provider_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    contract_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    document_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_types.id", ondelete="RESTRICT"),
        nullable=False,
    )
    blob_uri: Mapped[str] = mapped_column(String(2048), nullable=False)
    file_name: Mapped[str] = mapped_column(String(512), nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    issue_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    uploaded_by: Mapped[str] = mapped_column(String(256), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    verification_status: Mapped[VerificationStatus] = mapped_column(
        verification_status_enum,
        nullable=False,
        default=VerificationStatus.UNVERIFIED,
    )

    financial_entity: Mapped["FinancialEntity"] = relationship(
        back_populates="evidence_items"
    )
    provider: Mapped["ICTProvider | None"] = relationship(back_populates="evidence_items")
    contract: Mapped["Contract | None"] = relationship(back_populates="evidence_items")
    document_type: Mapped[DocumentType] = relationship()
    control_links: Mapped[list["EvidenceControlLink"]] = relationship(
        back_populates="evidence"
    )
