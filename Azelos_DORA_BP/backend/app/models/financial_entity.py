import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.business_function import BusinessFunction
    from app.models.contract import Contract
    from app.models.evidence import Evidence
    from app.models.exit_strategy import ExitStrategy
    from app.models.ict_assets import ICTAsset, InformationAsset
    from app.models.organization_profile import OrganizationProfile
    from app.models.provider import ICTProvider
    from app.models.risk import RiskAssessment


class FinancialEntity(Base, TimestampMixin):
    __tablename__ = "financial_entities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    legal_name: Mapped[str] = mapped_column(String(512), nullable=False)
    short_name: Mapped[str | None] = mapped_column(String(256))
    lei: Mapped[str | None] = mapped_column(String(20))
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    providers: Mapped[list["ICTProvider"]] = relationship(
        back_populates="financial_entity", cascade="all, delete-orphan"
    )
    contracts: Mapped[list["Contract"]] = relationship(back_populates="financial_entity")
    business_functions: Mapped[list["BusinessFunction"]] = relationship(
        back_populates="financial_entity"
    )
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(
        back_populates="financial_entity",
        overlaps="risk_assessments",
    )
    evidence_items: Mapped[list["Evidence"]] = relationship(
        back_populates="financial_entity",
        overlaps="contract,evidence_items,provider",
    )
    exit_strategies: Mapped[list["ExitStrategy"]] = relationship(
        back_populates="financial_entity",
        overlaps="contract,exit_strategies,provider",
    )
    profile: Mapped["OrganizationProfile | None"] = relationship(
        back_populates="financial_entity", uselist=False
    )
    information_assets: Mapped[list["InformationAsset"]] = relationship(
        back_populates="financial_entity"
    )
    ict_assets: Mapped[list["ICTAsset"]] = relationship(back_populates="financial_entity")
