import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import CriticalOrImportant, ServiceStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.business_function import FunctionServiceMapping
    from app.models.contract import Contract
    from app.models.exit_strategy import ExitStrategy
    from app.models.risk import RiskAssessment

service_status_enum = pg_enum(ServiceStatus, "service_status")
critical_or_important_enum = pg_enum(CriticalOrImportant, "critical_or_important")


class ServiceClassification(Base):
    """Configurable DORA / internal service taxonomy (not hard-coded enums)."""

    __tablename__ = "service_classifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ICTService(Base, TimestampMixin):
    __tablename__ = "ict_services"
    __table_args__ = (
        UniqueConstraint("id", "contract_id", name="uq_service_id_contract"),
        CheckConstraint(
            "data_location_country IS NULL OR data_location_country ~ '^[A-Z]{2}$'",
            name="ck_service_data_location_country",
        ),
        ForeignKeyConstraint(
            ["contract_id", "financial_entity_id"],
            ["contracts.id", "contracts.financial_entity_id"],
            name="fk_service_contract_same_entity",
            ondelete="CASCADE",
        ),
        Index("ix_ict_services_contract_id", "contract_id"),
        Index("ix_ict_services_financial_entity_id", "financial_entity_id"),
        Index("ix_ict_services_supports_cif", "supports_critical_or_important"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    classification_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service_classifications.id", ondelete="SET NULL"),
    )
    data_processing_location: Mapped[str | None] = mapped_column(String(256))
    data_storage_location: Mapped[str | None] = mapped_column(String(256))
    data_location_country: Mapped[str | None] = mapped_column(String(2))
    status: Mapped[ServiceStatus] = mapped_column(
        service_status_enum, nullable=False, default=ServiceStatus.ACTIVE
    )
    supports_critical_or_important: Mapped[CriticalOrImportant] = mapped_column(
        critical_or_important_enum,
        nullable=False,
        default=CriticalOrImportant.NEITHER,
    )

    contract: Mapped["Contract"] = relationship(back_populates="ict_services")
    classification: Mapped[ServiceClassification | None] = relationship()
    function_mappings: Mapped[list["FunctionServiceMapping"]] = relationship(
        back_populates="service"
    )
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(
        back_populates="service"
    )
    exit_strategies: Mapped[list["ExitStrategy"]] = relationship(
        back_populates="service"
    )
