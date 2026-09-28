import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import ContractStatus, ContractType
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.dora_control import ContractDoraControl
    from app.models.evidence import Evidence
    from app.models.exit_strategy import ExitStrategy
    from app.models.financial_entity import FinancialEntity
    from app.models.provider import ICTProvider
    from app.models.risk import RiskAssessment
    from app.models.service import ICTService

contract_status_enum = pg_enum(ContractStatus, "contract_status")
contract_type_enum = pg_enum(ContractType, "contract_type")


class Contract(Base, TimestampMixin):
    __tablename__ = "contracts"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id",
            "reference_number",
            name="uq_contract_reference_per_entity",
        ),
        UniqueConstraint("id", "financial_entity_id", name="uq_contract_id_entity"),
        CheckConstraint(
            "end_date IS NULL OR start_date <= end_date",
            name="ck_contract_date_range",
        ),
        ForeignKeyConstraint(
            ["provider_id", "financial_entity_id"],
            ["ict_providers.id", "ict_providers.financial_entity_id"],
            name="fk_contract_provider_same_entity",
            ondelete="RESTRICT",
        ),
        Index("ix_contracts_financial_entity_id", "financial_entity_id"),
        Index("ix_contracts_provider_id", "provider_id"),
        Index("ix_contracts_reference_number", "reference_number"),
        Index("ix_contracts_end_date", "end_date"),
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
    reference_number: Mapped[str] = mapped_column(String(128), nullable=False)
    contract_type: Mapped[ContractType] = mapped_column(
        contract_type_enum, nullable=False, default=ContractType.OUTSOURCING
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date)
    governing_law: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[ContractStatus] = mapped_column(
        contract_status_enum, nullable=False, default=ContractStatus.ACTIVE
    )
    renewal_date: Mapped[date | None] = mapped_column(Date)
    termination_notice_period_days: Mapped[int | None] = mapped_column(Integer)

    financial_entity: Mapped["FinancialEntity"] = relationship(back_populates="contracts")
    provider: Mapped["ICTProvider"] = relationship(
        back_populates="contracts",
        foreign_keys=[provider_id],
    )
    ict_services: Mapped[list["ICTService"]] = relationship(back_populates="contract")
    dora_controls: Mapped[list["ContractDoraControl"]] = relationship(
        back_populates="contract"
    )
    evidence_items: Mapped[list["Evidence"]] = relationship(back_populates="contract")
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(
        back_populates="contract"
    )
    exit_strategies: Mapped[list["ExitStrategy"]] = relationship(
        back_populates="contract"
    )
