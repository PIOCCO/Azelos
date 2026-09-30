import uuid

from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import TimestampMixin


class RequirementEvidenceLink(Base, TimestampMixin):
    __tablename__ = "requirement_evidence_links"
    __table_args__ = (
        UniqueConstraint(
            "organization_requirement_id",
            "evidence_id",
            name="uq_requirement_evidence",
        ),
        Index("ix_req_evidence_org", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    organization_requirement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization_requirements.id", ondelete="CASCADE"),
        nullable=False,
    )
    evidence_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evidence.id", ondelete="CASCADE"),
        nullable=False,
    )

    organization_requirement: Mapped["OrganizationRequirement"] = relationship()  # noqa: F821
    evidence: Mapped["Evidence"] = relationship()  # noqa: F821
