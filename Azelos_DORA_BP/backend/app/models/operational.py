"""Incidents, resilience tests, TLPT, BCP/DR — tenant-scoped operational entities."""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
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
from app.models.enums_operational import (
    ContinuityPlanStatus,
    IncidentLinkKind,
    IncidentSeverity,
    IncidentStatus,
    ResilienceTestKind,
    ResilienceTestStatus,
    TlptExerciseStatus,
)
from app.models.mixins import TimestampMixin

incident_status_enum = pg_enum(IncidentStatus, "ict_incident_status")
incident_severity_enum = pg_enum(IncidentSeverity, "ict_incident_severity")
incident_link_kind_enum = pg_enum(IncidentLinkKind, "ict_incident_link_kind")
resilience_test_status_enum = pg_enum(ResilienceTestStatus, "resilience_test_status")
resilience_test_kind_enum = pg_enum(ResilienceTestKind, "resilience_test_kind")
tlpt_status_enum = pg_enum(TlptExerciseStatus, "tlpt_exercise_status")
continuity_plan_status_enum = pg_enum(ContinuityPlanStatus, "continuity_plan_status")

if TYPE_CHECKING:
    from app.models.cloud_resilience import BusinessService, RecoveryTest, ResilienceFinding
    from app.models.financial_entity import FinancialEntity


class ICTIncident(Base, TimestampMixin):
    __tablename__ = "ict_incidents"
    __table_args__ = (
        Index("ix_ict_incidents_financial_entity_id", "financial_entity_id"),
        Index("ix_ict_incidents_status", "status"),
        Index("ix_ict_incidents_severity", "severity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[IncidentSeverity] = mapped_column(incident_severity_enum, nullable=False)
    status: Mapped[IncidentStatus] = mapped_column(
        incident_status_enum, nullable=False, default=IncidentStatus.DETECTED
    )
    is_major: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    owner: Mapped[str | None] = mapped_column(String(256))
    detected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    classified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    contained_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    root_cause: Mapped[str | None] = mapped_column(Text)
    lessons_learned: Mapped[str | None] = mapped_column(Text)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    links: Mapped[list["IncidentEntityLink"]] = relationship(
        back_populates="incident", cascade="all, delete-orphan"
    )
    timeline: Mapped[list["IncidentTimelineEvent"]] = relationship(
        back_populates="incident", cascade="all, delete-orphan", order_by="IncidentTimelineEvent.recorded_at"
    )


class IncidentEntityLink(Base):
    __tablename__ = "ict_incident_links"
    __table_args__ = (
        UniqueConstraint(
            "incident_id",
            "link_kind",
            "linked_entity_id",
            name="uq_incident_link",
        ),
        Index("ix_ict_incident_links_incident_id", "incident_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ict_incidents.id", ondelete="CASCADE"),
        nullable=False,
    )
    link_kind: Mapped[IncidentLinkKind] = mapped_column(incident_link_kind_enum, nullable=False)
    linked_entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(512))

    incident: Mapped["ICTIncident"] = relationship(back_populates="links")


class IncidentTimelineEvent(Base):
    __tablename__ = "ict_incident_timeline"
    __table_args__ = (Index("ix_ict_incident_timeline_incident_id", "incident_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ict_incidents.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    actor: Mapped[str] = mapped_column(String(256), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    incident: Mapped["ICTIncident"] = relationship(back_populates="timeline")


class ResilienceTestCampaign(Base, TimestampMixin):
    """Organizational resilience test campaign (distinct from recovery_tests DR records)."""

    __tablename__ = "resilience_tests"
    __table_args__ = (
        Index("ix_resilience_tests_financial_entity_id", "financial_entity_id"),
        Index("ix_resilience_tests_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    test_kind: Mapped[ResilienceTestKind] = mapped_column(
        resilience_test_kind_enum, nullable=False
    )
    status: Mapped[ResilienceTestStatus] = mapped_column(
        resilience_test_status_enum, nullable=False, default=ResilienceTestStatus.PLANNED
    )
    scenario: Mapped[str | None] = mapped_column(Text)
    scope_summary: Mapped[str | None] = mapped_column(Text)
    owner: Mapped[str | None] = mapped_column(String(256))
    planned_date: Mapped[date | None] = mapped_column(Date)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    outcome_summary: Mapped[str | None] = mapped_column(Text)
    business_service_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_services.id", ondelete="SET NULL"),
    )
    ict_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ict_assets.id", ondelete="SET NULL"),
    )
    recovery_test_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recovery_tests.id", ondelete="SET NULL"),
    )
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TlptExercise(Base, TimestampMixin):
    __tablename__ = "tlpt_exercises"
    __table_args__ = (Index("ix_tlpt_exercises_financial_entity_id", "financial_entity_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[TlptExerciseStatus] = mapped_column(
        tlpt_status_enum, nullable=False, default=TlptExerciseStatus.SCOPED
    )
    scope_summary: Mapped[str | None] = mapped_column(Text)
    threat_intelligence_summary: Mapped[str | None] = mapped_column(Text)
    attack_scenario: Mapped[str | None] = mapped_column(Text)
    owner: Mapped[str | None] = mapped_column(String(256))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    final_report_summary: Mapped[str | None] = mapped_column(Text)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class BusinessContinuityPlan(Base, TimestampMixin):
    __tablename__ = "business_continuity_plans"
    __table_args__ = (Index("ix_bcp_financial_entity_id", "financial_entity_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[ContinuityPlanStatus] = mapped_column(
        continuity_plan_status_enum, nullable=False, default=ContinuityPlanStatus.DRAFT
    )
    business_service_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_services.id", ondelete="SET NULL"),
    )
    owner: Mapped[str | None] = mapped_column(String(256))
    rto_minutes: Mapped[int | None] = mapped_column()
    rpo_minutes: Mapped[int | None] = mapped_column()
    backup_strategy: Mapped[str | None] = mapped_column(Text)
    last_review_at: Mapped[date | None] = mapped_column(Date)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class DisasterRecoveryPlan(Base, TimestampMixin):
    __tablename__ = "disaster_recovery_plans"
    __table_args__ = (Index("ix_drp_financial_entity_id", "financial_entity_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[ContinuityPlanStatus] = mapped_column(
        continuity_plan_status_enum, nullable=False, default=ContinuityPlanStatus.DRAFT
    )
    business_service_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_services.id", ondelete="SET NULL"),
    )
    owner: Mapped[str | None] = mapped_column(String(256))
    recovery_strategy: Mapped[str | None] = mapped_column(Text)
    failover_capability: Mapped[str | None] = mapped_column(Text)
    last_recovery_test_at: Mapped[date | None] = mapped_column(Date)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
