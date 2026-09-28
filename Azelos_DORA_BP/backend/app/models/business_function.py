import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
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
from app.models.enums import BusinessFunctionStatus, CriticalOrImportant
from app.models.service import critical_or_important_enum
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.exit_strategy import ExitStrategy
    from app.models.financial_entity import FinancialEntity
    from app.models.service import ICTService

business_function_status_enum = pg_enum(
    BusinessFunctionStatus, "business_function_status"
)


class BusinessFunction(Base, TimestampMixin):
    __tablename__ = "business_functions"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id",
            "function_identifier",
            name="uq_function_identifier_per_entity",
        ),
        Index("ix_business_functions_financial_entity_id", "financial_entity_id"),
        Index("ix_business_functions_criticality", "critical_or_important"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    critical_or_important: Mapped[CriticalOrImportant] = mapped_column(
        critical_or_important_enum, nullable=False
    )
    function_identifier: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[BusinessFunctionStatus] = mapped_column(
        business_function_status_enum,
        nullable=False,
        default=BusinessFunctionStatus.ACTIVE,
    )
    exit_strategy_required: Mapped[bool] = mapped_column(default=False, nullable=False)

    financial_entity: Mapped["FinancialEntity"] = relationship(
        back_populates="business_functions"
    )
    service_mappings: Mapped[list["FunctionServiceMapping"]] = relationship(
        back_populates="business_function"
    )
    exit_strategies: Mapped[list["ExitStrategy"]] = relationship(
        back_populates="business_function"
    )


class FunctionServiceMapping(Base):
    __tablename__ = "function_service_mappings"
    __table_args__ = (
        UniqueConstraint("function_id", "service_id", name="uq_function_service"),
        Index("ix_function_service_mappings_function_id", "function_id"),
        Index("ix_function_service_mappings_service_id", "service_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    function_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_functions.id", ondelete="CASCADE"),
        nullable=False,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ict_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    business_function: Mapped["BusinessFunction"] = relationship(
        back_populates="service_mappings"
    )
    service: Mapped["ICTService"] = relationship(back_populates="function_mappings")
