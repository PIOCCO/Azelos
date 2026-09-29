import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import ProviderStatus, ProviderType
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.contract import Contract
    from app.models.evidence import Evidence
    from app.models.financial_entity import FinancialEntity
    from app.models.risk import RiskAssessment
    from app.models.subcontractor import Subcontractor

provider_status_enum = pg_enum(ProviderStatus, "provider_status")
provider_type_enum = pg_enum(ProviderType, "provider_type")


class ICTProvider(Base, TimestampMixin):
    __tablename__ = "ict_providers"
    __table_args__ = (
        UniqueConstraint("financial_entity_id", "lei", name="uq_provider_lei_per_entity"),
        UniqueConstraint(
            "id", "financial_entity_id", name="uq_provider_id_entity"
        ),
        CheckConstraint(
            "lei IS NULL OR (char_length(lei) = 20 AND lei ~ '^[A-Z0-9]{20}$')",
            name="ck_provider_lei_format",
        ),
        CheckConstraint(
            "country_code ~ '^[A-Z]{2}$'",
            name="ck_provider_country_iso2",
        ),
        Index("ix_ict_providers_financial_entity_id", "financial_entity_id"),
        Index("ix_ict_providers_legal_name", "legal_name"),
        Index("ix_ict_providers_lei", "lei"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    legal_name: Mapped[str] = mapped_column(String(512), nullable=False)
    trading_name: Mapped[str | None] = mapped_column(String(512))
    lei: Mapped[str | None] = mapped_column(String(20))
    euid: Mapped[str | None] = mapped_column(String(64))
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    provider_type: Mapped[ProviderType] = mapped_column(
        provider_type_enum, nullable=False, default=ProviderType.ICT_THIRD_PARTY
    )
    status: Mapped[ProviderStatus] = mapped_column(
        provider_status_enum, nullable=False, default=ProviderStatus.ACTIVE
    )
    website: Mapped[str | None] = mapped_column(String(2048))

    financial_entity: Mapped["FinancialEntity"] = relationship(back_populates="providers")
    contracts: Mapped[list["Contract"]] = relationship(
        back_populates="provider",
        overlaps="contracts,financial_entity",
    )
    subcontractors: Mapped[list["Subcontractor"]] = relationship(
        back_populates="provider", foreign_keys="Subcontractor.provider_id"
    )
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(
        back_populates="provider",
        overlaps="risk_assessments,risk_assessments",
    )
    evidence_items: Mapped[list["Evidence"]] = relationship(
        back_populates="provider",
        overlaps="contract,evidence_items,evidence_items,financial_entity",
    )
