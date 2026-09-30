import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import TimestampMixin


class BusinessImpactAssessment(Base, TimestampMixin):
    """Minimal BIA per business function — separate from ICT asset inherent criticality."""

    __tablename__ = "business_impact_assessments"
    __table_args__ = (
        Index("ix_bia_financial_entity_id", "financial_entity_id"),
        Index("ix_bia_business_function_id", "business_function_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    business_function_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_functions.id", ondelete="CASCADE"),
        nullable=False,
    )
    rto_hours: Mapped[int | None] = mapped_column(Integer)
    rpo_hours: Mapped[int | None] = mapped_column(Integer)
    mtd_hours: Mapped[int | None] = mapped_column(Integer)
    impact_summary: Mapped[str | None] = mapped_column(Text)
    review_owner: Mapped[str | None] = mapped_column(Text)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    business_function: Mapped["BusinessFunction"] = relationship()  # noqa: F821
