import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums import CriticalOrImportant
from app.models.mixins import TimestampMixin
from app.models.service import critical_or_important_enum as inherent_criticality_enum

if TYPE_CHECKING:
    from app.models.business_function import BusinessFunction
    from app.models.financial_entity import FinancialEntity

class InformationAsset(Base, TimestampMixin):
    __tablename__ = "information_assets"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id",
            "asset_identifier",
            name="uq_information_asset_identifier_per_entity",
        ),
        Index("ix_information_assets_financial_entity_id", "financial_entity_id"),
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
    asset_identifier: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    financial_entity: Mapped["FinancialEntity"] = relationship(
        back_populates="information_assets"
    )
    ict_assets: Mapped[list["ICTAsset"]] = relationship(back_populates="information_asset")


class ICTAsset(Base, TimestampMixin):
    __tablename__ = "ict_assets"
    __table_args__ = (
        UniqueConstraint(
            "financial_entity_id",
            "asset_identifier",
            name="uq_ict_asset_identifier_per_entity",
        ),
        Index("ix_ict_assets_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    information_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("information_assets.id", ondelete="SET NULL"),
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    asset_identifier: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    inherent_criticality: Mapped[CriticalOrImportant] = mapped_column(
        inherent_criticality_enum,
        nullable=False,
        default=CriticalOrImportant.NEITHER,
    )

    financial_entity: Mapped["FinancialEntity"] = relationship(back_populates="ict_assets")
    information_asset: Mapped["InformationAsset | None"] = relationship(
        back_populates="ict_assets"
    )
    function_maps: Mapped[list["AssetFunctionMap"]] = relationship(
        back_populates="ict_asset"
    )


class AssetFunctionMap(Base, TimestampMixin):
    """Links business functions to ICT assets without mutating inherent criticality."""

    __tablename__ = "asset_function_maps"
    __table_args__ = (
        UniqueConstraint("function_id", "ict_asset_id", name="uq_function_ict_asset"),
        Index("ix_asset_function_maps_function_id", "function_id"),
        Index("ix_asset_function_maps_ict_asset_id", "ict_asset_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    function_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_functions.id", ondelete="CASCADE"),
        nullable=False,
    )
    ict_asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ict_assets.id", ondelete="CASCADE"),
        nullable=False,
    )
    supports_critical_function: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    business_function: Mapped["BusinessFunction"] = relationship(
        back_populates="asset_maps"
    )
    ict_asset: Mapped["ICTAsset"] = relationship(back_populates="function_maps")
