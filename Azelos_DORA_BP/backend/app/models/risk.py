import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import RiskDimensionLevel, RiskLevel

if TYPE_CHECKING:
    from app.models.contract import Contract
    from app.models.financial_entity import FinancialEntity
    from app.models.provider import ICTProvider
    from app.models.service import ICTService

risk_level_enum = pg_enum(RiskLevel, "risk_level")
risk_dimension_enum = pg_enum(RiskDimensionLevel, "risk_dimension_level")


class RiskAssessment(Base):
    """Append-only supplier risk assessments (history preserved)."""

    __tablename__ = "risk_assessments"
    __table_args__ = (
        CheckConstraint(
            "num_nonnulls(provider_id, contract_id, service_id) >= 1",
            name="ck_risk_assessment_target",
        ),
        ForeignKeyConstraint(
            ["provider_id", "financial_entity_id"],
            ["ict_providers.id", "ict_providers.financial_entity_id"],
            name="fk_risk_provider_same_entity",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["contract_id", "financial_entity_id"],
            ["contracts.id", "contracts.financial_entity_id"],
            name="fk_risk_contract_same_entity",
            ondelete="RESTRICT",
        ),
        Index("ix_risk_assessments_financial_entity_id", "financial_entity_id"),
        Index("ix_risk_assessments_provider_id", "provider_id"),
        Index("ix_risk_assessments_calculated_at", "calculated_at"),
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
    service_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ict_services.id", ondelete="RESTRICT"),
    )

    criticality: Mapped[RiskDimensionLevel] = mapped_column(
        risk_dimension_enum, nullable=False
    )
    data_sensitivity: Mapped[RiskDimensionLevel] = mapped_column(
        risk_dimension_enum, nullable=False
    )
    substitutability: Mapped[RiskDimensionLevel] = mapped_column(
        risk_dimension_enum, nullable=False
    )
    concentration_risk: Mapped[RiskDimensionLevel] = mapped_column(
        risk_dimension_enum, nullable=False
    )
    geographic_risk: Mapped[RiskDimensionLevel] = mapped_column(
        risk_dimension_enum, nullable=False
    )
    security_assurance: Mapped[RiskDimensionLevel] = mapped_column(
        risk_dimension_enum, nullable=False
    )
    contract_gaps: Mapped[RiskDimensionLevel] = mapped_column(
        risk_dimension_enum, nullable=False
    )
    exit_feasibility: Mapped[RiskDimensionLevel] = mapped_column(
        risk_dimension_enum, nullable=False
    )

    calculation_version: Mapped[str] = mapped_column(String(32), nullable=False)
    resulting_risk_level: Mapped[RiskLevel] = mapped_column(
        risk_level_enum, nullable=False
    )
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    assessor: Mapped[str] = mapped_column(String(256), nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text)

    financial_entity: Mapped["FinancialEntity"] = relationship(
        back_populates="risk_assessments",
        overlaps="risk_assessments,risk_assessments",
    )
    provider: Mapped["ICTProvider | None"] = relationship(
        back_populates="risk_assessments",
        overlaps="financial_entity,risk_assessments,risk_assessments",
    )
    contract: Mapped["Contract | None"] = relationship(
        back_populates="risk_assessments",
        overlaps="financial_entity,provider,risk_assessments,risk_assessments",
    )
    service: Mapped["ICTService | None"] = relationship(
        back_populates="risk_assessments"
    )
