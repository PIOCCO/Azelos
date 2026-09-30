"""Cloud environment, business services, resilience assessments, findings."""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums_resilience import (
    AssessmentResult,
    BusinessServiceCriticality,
    BusinessServiceStatus,
    CloudAccountStatus,
    CloudProviderType,
    CloudResourceStatus,
    DoraControlImplementationStatus,
    EvidenceSourceKind,
    FindingSeverity,
    FindingStatus,
    ProvenanceType,
    RecoveryTestOutcome,
    RemediationStatus,
    ResilienceControlArea,
    ServiceDependencyKind,
)
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.dora_baseline import DoraRequirement, OrganizationRequirement
    from app.models.evidence import Evidence
    from app.models.financial_entity import FinancialEntity

cloud_provider_enum = pg_enum(CloudProviderType, "cloud_provider_type")
cloud_account_status_enum = pg_enum(CloudAccountStatus, "cloud_account_status")
provenance_enum = pg_enum(ProvenanceType, "provenance_type")
evidence_source_enum = pg_enum(EvidenceSourceKind, "evidence_source_kind")
resilience_area_enum = pg_enum(ResilienceControlArea, "resilience_control_area")
assessment_result_enum = pg_enum(AssessmentResult, "assessment_result")
finding_severity_enum = pg_enum(FindingSeverity, "finding_severity")
finding_status_enum = pg_enum(FindingStatus, "finding_status")
remediation_status_enum = pg_enum(RemediationStatus, "remediation_status")
recovery_test_outcome_enum = pg_enum(RecoveryTestOutcome, "recovery_test_outcome")
dora_impl_status_enum = pg_enum(
    DoraControlImplementationStatus, "dora_control_implementation_status"
)
business_service_status_enum = pg_enum(BusinessServiceStatus, "business_service_status")
business_service_criticality_enum = pg_enum(
    BusinessServiceCriticality, "business_service_criticality"
)
service_dependency_kind_enum = pg_enum(ServiceDependencyKind, "service_dependency_kind")
cloud_resource_status_enum = pg_enum(CloudResourceStatus, "cloud_resource_status")


class CloudAccount(Base, TimestampMixin):
    __tablename__ = "cloud_accounts"
    __table_args__ = (
        Index("ix_cloud_accounts_financial_entity_id", "financial_entity_id"),
        UniqueConstraint(
            "financial_entity_id",
            "provider",
            "subscription_id",
            name="uq_cloud_account_subscription",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[CloudProviderType] = mapped_column(cloud_provider_enum, nullable=False)
    display_name: Mapped[str] = mapped_column(String(256), nullable=False)
    subscription_id: Mapped[str] = mapped_column(String(128), nullable=False)
    tenant_id: Mapped[str | None] = mapped_column(String(128))
    default_region: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[CloudAccountStatus] = mapped_column(
        cloud_account_status_enum, nullable=False, default=CloudAccountStatus.ACTIVE
    )
    auth_config_ref: Mapped[str | None] = mapped_column(
        String(64),
        doc="Server-side env prefix for credentials — never stores secrets.",
    )
    last_discovery_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_discovery_status: Mapped[str | None] = mapped_column(String(512))

    resources: Mapped[list["CloudResource"]] = relationship(back_populates="cloud_account")


class CloudResource(Base, TimestampMixin):
    __tablename__ = "cloud_resources"
    __table_args__ = (
        Index("ix_cloud_resources_financial_entity_id", "financial_entity_id"),
        Index("ix_cloud_resources_cloud_account_id", "cloud_account_id"),
        Index("ix_cloud_resources_business_service_id", "business_service_id"),
        UniqueConstraint(
            "cloud_account_id",
            "provider_resource_id",
            name="uq_cloud_resource_provider_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    cloud_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cloud_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    business_service_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_services.id", ondelete="SET NULL"),
    )
    provider_resource_id: Mapped[str] = mapped_column(String(512), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    resource_group: Mapped[str | None] = mapped_column(String(256))
    region: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[CloudResourceStatus] = mapped_column(
        cloud_resource_status_enum, nullable=False, default=CloudResourceStatus.UNKNOWN
    )
    provenance: Mapped[ProvenanceType] = mapped_column(
        provenance_enum, nullable=False, default=ProvenanceType.DISCOVERED
    )
    last_discovered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB)

    cloud_account: Mapped[CloudAccount] = relationship(back_populates="resources")
    business_service: Mapped["BusinessService | None"] = relationship(
        back_populates="cloud_resources"
    )


class BusinessService(Base, TimestampMixin):
    __tablename__ = "business_services"
    __table_args__ = (Index("ix_business_services_financial_entity_id", "financial_entity_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    criticality: Mapped[BusinessServiceCriticality] = mapped_column(
        business_service_criticality_enum, nullable=False, default=BusinessServiceCriticality.MEDIUM
    )
    business_owner: Mapped[str | None] = mapped_column(String(256))
    technical_owner: Mapped[str | None] = mapped_column(String(256))
    rto_minutes: Mapped[int | None] = mapped_column(Integer)
    rpo_minutes: Mapped[int | None] = mapped_column(Integer)
    availability_target: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[BusinessServiceStatus] = mapped_column(
        business_service_status_enum, nullable=False, default=BusinessServiceStatus.ACTIVE
    )
    measured_recovery_minutes: Mapped[int | None] = mapped_column(Integer)
    measured_data_loss_minutes: Mapped[int | None] = mapped_column(Integer)
    last_recovery_test_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    cloud_resources: Mapped[list[CloudResource]] = relationship(back_populates="business_service")
    dependencies: Mapped[list["ServiceDependency"]] = relationship(
        back_populates="business_service",
        foreign_keys="ServiceDependency.business_service_id",
    )


class ServiceDependency(Base, TimestampMixin):
    __tablename__ = "service_dependencies"
    __table_args__ = (
        Index("ix_service_dependencies_business_service_id", "business_service_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    business_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    dependency_kind: Mapped[ServiceDependencyKind] = mapped_column(
        service_dependency_kind_enum, nullable=False
    )
    cloud_resource_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cloud_resources.id", ondelete="SET NULL")
    )
    provenance: Mapped[ProvenanceType] = mapped_column(
        provenance_enum, nullable=False, default=ProvenanceType.USER_PROVIDED
    )
    description: Mapped[str | None] = mapped_column(Text)

    business_service: Mapped[BusinessService] = relationship(
        back_populates="dependencies",
        foreign_keys=[business_service_id],
    )


class ResilienceAssessment(Base, TimestampMixin):
    __tablename__ = "resilience_assessments"
    __table_args__ = (
        Index("ix_resilience_assessments_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    business_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    assessed_by: Mapped[str] = mapped_column(String(256), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    has_gaps: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    controls: Mapped[list["ResilienceAssessmentControl"]] = relationship(
        back_populates="assessment"
    )


class ResilienceAssessmentControl(Base, TimestampMixin):
    __tablename__ = "resilience_assessment_controls"
    __table_args__ = (
        Index("ix_resilience_assessment_controls_assessment_id", "assessment_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resilience_assessments.id", ondelete="CASCADE"),
        nullable=False,
    )
    cloud_resource_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cloud_resources.id", ondelete="SET NULL")
    )
    control_area: Mapped[ResilienceControlArea] = mapped_column(
        resilience_area_enum, nullable=False
    )
    result: Mapped[AssessmentResult] = mapped_column(assessment_result_enum, nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text)
    source_kind: Mapped[EvidenceSourceKind] = mapped_column(
        evidence_source_enum, nullable=False, default=EvidenceSourceKind.CALCULATED
    )

    assessment: Mapped[ResilienceAssessment] = relationship(back_populates="controls")


class ResilienceFinding(Base, TimestampMixin):
    __tablename__ = "resilience_findings"
    __table_args__ = (
        Index("ix_resilience_findings_financial_entity_id", "financial_entity_id"),
        Index("ix_resilience_findings_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[FindingSeverity] = mapped_column(finding_severity_enum, nullable=False)
    status: Mapped[FindingStatus] = mapped_column(
        finding_status_enum, nullable=False, default=FindingStatus.OPEN
    )
    business_service_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("business_services.id", ondelete="SET NULL")
    )
    cloud_resource_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cloud_resources.id", ondelete="SET NULL")
    )
    organization_requirement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization_requirements.id", ondelete="SET NULL"),
    )
    control_area: Mapped[ResilienceControlArea | None] = mapped_column(resilience_area_enum)
    recommendation: Mapped[str | None] = mapped_column(Text)
    owner: Mapped[str | None] = mapped_column(String(256))
    due_date: Mapped[date | None] = mapped_column(Date)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[str] = mapped_column(String(256), nullable=False)


class RemediationAction(Base, TimestampMixin):
    __tablename__ = "remediation_actions"
    __table_args__ = (
        Index("ix_remediation_actions_finding_id", "finding_id"),
        Index("ix_remediation_actions_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    finding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resilience_findings.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    owner: Mapped[str | None] = mapped_column(String(256))
    due_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[RemediationStatus] = mapped_column(
        remediation_status_enum, nullable=False, default=RemediationStatus.OPEN
    )
    verification_notes: Mapped[str | None] = mapped_column(Text)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ResilienceEvidenceItem(Base, TimestampMixin):
    __tablename__ = "resilience_evidence_items"
    __table_args__ = (
        Index("ix_resilience_evidence_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    source_kind: Mapped[EvidenceSourceKind] = mapped_column(
        evidence_source_enum, nullable=False
    )
    provenance: Mapped[ProvenanceType] = mapped_column(
        provenance_enum, nullable=False, default=ProvenanceType.USER_PROVIDED
    )
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    review_due: Mapped[date | None] = mapped_column(Date)
    business_service_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("business_services.id", ondelete="SET NULL")
    )
    cloud_resource_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cloud_resources.id", ondelete="SET NULL")
    )
    organization_requirement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization_requirements.id", ondelete="SET NULL"),
    )
    uploaded_evidence_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evidence.id", ondelete="SET NULL")
    )
    collected_by: Mapped[str] = mapped_column(String(256), nullable=False)
    verification_status: Mapped[str] = mapped_column(String(32), default="unverified")
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB)


class RecoveryTest(Base, TimestampMixin):
    __tablename__ = "recovery_tests"
    __table_args__ = (
        Index("ix_recovery_tests_financial_entity_id", "financial_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    business_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    scenario: Mapped[str] = mapped_column(String(512), nullable=False)
    target_rto_minutes: Mapped[int | None] = mapped_column(Integer)
    target_rpo_minutes: Mapped[int | None] = mapped_column(Integer)
    actual_recovery_minutes: Mapped[int | None] = mapped_column(Integer)
    actual_data_loss_minutes: Mapped[int | None] = mapped_column(Integer)
    outcome: Mapped[RecoveryTestOutcome] = mapped_column(
        recovery_test_outcome_enum, nullable=False, default=RecoveryTestOutcome.NOT_RUN
    )
    participants: Mapped[str | None] = mapped_column(Text)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str] = mapped_column(String(256), nullable=False)


class BusinessServiceDoraLink(Base, TimestampMixin):
    """Maps a business service to an organization DORA requirement with factual status."""

    __tablename__ = "business_service_dora_links"
    __table_args__ = (
        UniqueConstraint(
            "business_service_id",
            "organization_requirement_id",
            name="uq_service_dora_requirement",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    business_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    organization_requirement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization_requirements.id", ondelete="CASCADE"),
        nullable=False,
    )
    implementation_status: Mapped[DoraControlImplementationStatus] = mapped_column(
        dora_impl_status_enum,
        nullable=False,
        default=DoraControlImplementationStatus.NOT_ASSESSED,
    )
    last_assessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    owner: Mapped[str | None] = mapped_column(String(256))
