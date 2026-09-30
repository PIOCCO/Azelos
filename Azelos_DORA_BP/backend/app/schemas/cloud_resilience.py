from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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


class CloudAccountCreate(BaseModel):
    provider: CloudProviderType = CloudProviderType.AZURE
    display_name: str = Field(min_length=1, max_length=256)
    subscription_id: str = Field(min_length=1, max_length=128)
    tenant_id: str | None = Field(default=None, max_length=128)
    default_region: str | None = Field(default=None, max_length=64)
    auth_config_ref: str | None = Field(
        default=None,
        max_length=64,
        description="Server env prefix only — never a secret value.",
    )


class CloudAccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: CloudProviderType
    display_name: str
    subscription_id: str
    tenant_id: str | None
    default_region: str | None
    status: CloudAccountStatus
    auth_config_ref: str | None
    last_discovery_at: datetime | None
    last_discovery_status: str | None
    created_at: datetime
    updated_at: datetime


class CloudResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cloud_account_id: UUID
    business_service_id: UUID | None
    provider_resource_id: str
    resource_type: str
    name: str
    resource_group: str | None
    region: str | None
    status: CloudResourceStatus
    provenance: ProvenanceType
    last_discovered_at: datetime | None
    metadata: dict | None = Field(default=None, validation_alias="metadata_")


class CloudResourceLinkService(BaseModel):
    business_service_id: UUID | None


class BusinessServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=256)
    description: str | None = None
    criticality: BusinessServiceCriticality = BusinessServiceCriticality.MEDIUM
    business_owner: str | None = None
    technical_owner: str | None = None
    rto_minutes: int | None = Field(default=None, ge=0)
    rpo_minutes: int | None = Field(default=None, ge=0)
    availability_target: str | None = None
    status: BusinessServiceStatus = BusinessServiceStatus.ACTIVE


class BusinessServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=256)
    description: str | None = None
    criticality: BusinessServiceCriticality | None = None
    business_owner: str | None = None
    technical_owner: str | None = None
    rto_minutes: int | None = Field(default=None, ge=0)
    rpo_minutes: int | None = Field(default=None, ge=0)
    availability_target: str | None = None
    status: BusinessServiceStatus | None = None
    measured_recovery_minutes: int | None = Field(default=None, ge=0)
    measured_data_loss_minutes: int | None = Field(default=None, ge=0)


class BusinessServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    criticality: BusinessServiceCriticality
    business_owner: str | None
    technical_owner: str | None
    rto_minutes: int | None
    rpo_minutes: int | None
    availability_target: str | None
    status: BusinessServiceStatus
    measured_recovery_minutes: int | None
    measured_data_loss_minutes: int | None
    last_recovery_test_at: datetime | None
    rto_gap_minutes: int | None = None
    rpo_gap_minutes: int | None = None


class ServiceDependencyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=256)
    dependency_kind: ServiceDependencyKind
    cloud_resource_id: UUID | None = None
    description: str | None = None
    provenance: ProvenanceType = ProvenanceType.USER_PROVIDED


class ServiceDependencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_service_id: UUID
    name: str
    dependency_kind: ServiceDependencyKind
    cloud_resource_id: UUID | None
    provenance: ProvenanceType
    description: str | None


class ResilienceFindingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    description: str | None = None
    severity: FindingSeverity
    business_service_id: UUID | None = None
    cloud_resource_id: UUID | None = None
    organization_requirement_id: UUID | None = None
    control_area: ResilienceControlArea | None = None
    recommendation: str | None = None
    owner: str | None = None
    due_date: date | None = None


class ResilienceFindingUpdate(BaseModel):
    status: FindingStatus | None = None
    owner: str | None = None
    due_date: date | None = None
    description: str | None = None


class ResilienceFindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    severity: FindingSeverity
    status: FindingStatus
    business_service_id: UUID | None
    cloud_resource_id: UUID | None
    organization_requirement_id: UUID | None
    control_area: ResilienceControlArea | None
    recommendation: str | None
    owner: str | None
    due_date: date | None
    resolved_at: datetime | None
    created_by: str


class RemediationCreate(BaseModel):
    finding_id: UUID
    title: str = Field(min_length=1, max_length=512)
    owner: str | None = None
    due_date: date | None = None


class RemediationUpdate(BaseModel):
    status: RemediationStatus | None = None
    owner: str | None = None
    due_date: date | None = None
    verification_notes: str | None = None


class RemediationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    finding_id: UUID
    title: str
    owner: str | None
    due_date: date | None
    status: RemediationStatus
    verification_notes: str | None
    verified_at: datetime | None


class ResilienceEvidenceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    description: str | None = None
    source_kind: EvidenceSourceKind
    provenance: ProvenanceType = ProvenanceType.USER_PROVIDED
    review_due: date | None = None
    business_service_id: UUID | None = None
    cloud_resource_id: UUID | None = None
    organization_requirement_id: UUID | None = None
    uploaded_evidence_id: UUID | None = None
    metadata: dict | None = None


class ResilienceEvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    source_kind: EvidenceSourceKind
    provenance: ProvenanceType
    collected_at: datetime
    review_due: date | None
    business_service_id: UUID | None
    cloud_resource_id: UUID | None
    organization_requirement_id: UUID | None
    uploaded_evidence_id: UUID | None
    collected_by: str
    verification_status: str
    metadata: dict | None = Field(default=None, validation_alias="metadata_")


class RecoveryTestCreate(BaseModel):
    business_service_id: UUID
    scenario: str = Field(min_length=1, max_length=512)
    target_rto_minutes: int | None = Field(default=None, ge=0)
    target_rpo_minutes: int | None = Field(default=None, ge=0)
    actual_recovery_minutes: int | None = Field(default=None, ge=0)
    actual_data_loss_minutes: int | None = Field(default=None, ge=0)
    participants: str | None = None
    executed_at: datetime | None = None
    notes: str | None = None


class RecoveryTestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_service_id: UUID
    scenario: str
    target_rto_minutes: int | None
    target_rpo_minutes: int | None
    actual_recovery_minutes: int | None
    actual_data_loss_minutes: int | None
    outcome: RecoveryTestOutcome
    participants: str | None
    executed_at: datetime | None
    notes: str | None
    created_by: str


class AssessmentControlOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cloud_resource_id: UUID | None
    control_area: ResilienceControlArea
    result: AssessmentResult
    rationale: str | None
    source_kind: EvidenceSourceKind


class AssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_service_id: UUID
    assessed_by: str
    summary: str | None
    has_gaps: bool
    controls: list[AssessmentControlOut] = []


class ResilienceDashboardOut(BaseModel):
    critical_business_services: int
    services_with_gaps: int
    high_findings: int
    open_findings: int
    open_remediations: int
    cloud_resources: int
    recovery_tests_passed: int
    recovery_tests_failed: int
    recovery_tests_not_run: int
    dora_implemented: int
    dora_partial: int
    dora_not_implemented: int
    dora_insufficient_evidence: int
    dora_not_assessed: int


class BusinessServiceDoraLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_service_id: UUID
    organization_requirement_id: UUID
    implementation_status: DoraControlImplementationStatus
    last_assessed_at: datetime | None
    next_review_at: datetime | None
    owner: str | None


class BusinessServiceDoraLinkUpdate(BaseModel):
    implementation_status: DoraControlImplementationStatus
    owner: str | None = None
    next_review_at: datetime | None = None
