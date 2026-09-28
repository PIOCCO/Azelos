import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import ExitStrategyStatus, ExitTestResult
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.business_function import BusinessFunction
    from app.models.contract import Contract
    from app.models.evidence import Evidence
    from app.models.financial_entity import FinancialEntity
    from app.models.provider import ICTProvider
    from app.models.service import ICTService

exit_strategy_status_enum = pg_enum(ExitStrategyStatus, "exit_strategy_status")
exit_test_result_enum = pg_enum(ExitTestResult, "exit_test_result")


class ExitStrategy(Base, TimestampMixin):
    __tablename__ = "exit_strategies"
    __table_args__ = (
        ForeignKeyConstraint(
            ["provider_id", "financial_entity_id"],
            ["ict_providers.id", "ict_providers.financial_entity_id"],
            name="fk_exit_provider_same_entity",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["contract_id", "financial_entity_id"],
            ["contracts.id", "contracts.financial_entity_id"],
            name="fk_exit_contract_same_entity",
            ondelete="RESTRICT",
        ),
        Index("ix_exit_strategies_financial_entity_id", "financial_entity_id"),
        Index("ix_exit_strategies_business_function_id", "business_function_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    business_function_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_functions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ict_services.id", ondelete="RESTRICT"),
        nullable=False,
    )
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    provider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    exit_objective: Mapped[str] = mapped_column(Text, nullable=False)
    alternative_provider_name: Mapped[str | None] = mapped_column(String(512))
    migration_strategy: Mapped[str | None] = mapped_column(Text)
    rto_hours: Mapped[int | None] = mapped_column(Integer)
    rpo_hours: Mapped[int | None] = mapped_column(Integer)
    data_portability_notes: Mapped[str | None] = mapped_column(Text)
    dependencies_notes: Mapped[str | None] = mapped_column(Text)
    test_date: Mapped[date | None] = mapped_column(Date)
    test_result: Mapped[ExitTestResult] = mapped_column(
        exit_test_result_enum, nullable=False, default=ExitTestResult.NOT_TESTED
    )
    status: Mapped[ExitStrategyStatus] = mapped_column(
        exit_strategy_status_enum, nullable=False, default=ExitStrategyStatus.DRAFT
    )
    primary_evidence_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evidence.id", ondelete="SET NULL"),
    )

    financial_entity: Mapped["FinancialEntity"] = relationship(
        back_populates="exit_strategies"
    )
    business_function: Mapped["BusinessFunction"] = relationship(
        back_populates="exit_strategies"
    )
    service: Mapped["ICTService"] = relationship(back_populates="exit_strategies")
    contract: Mapped["Contract"] = relationship(back_populates="exit_strategies")
    provider: Mapped["ICTProvider"] = relationship()
    primary_evidence: Mapped["Evidence | None"] = relationship()
