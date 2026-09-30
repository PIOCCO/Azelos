from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.cloud_resilience import (
    BusinessService,
    BusinessServiceDoraLink,
    CloudResource,
    RecoveryTest,
    RemediationAction,
    ResilienceAssessment,
    ResilienceFinding,
)
from app.models.enums_resilience import (
    BusinessServiceCriticality,
    DoraControlImplementationStatus,
    FindingSeverity,
    FindingStatus,
    RecoveryTestOutcome,
    RemediationStatus,
)
from app.schemas.cloud_resilience import ResilienceDashboardOut


def build_dashboard(db: Session, organization_id: UUID) -> ResilienceDashboardOut:
    org = organization_id
    critical = (
        db.scalar(
            select(func.count(BusinessService.id)).where(
                BusinessService.financial_entity_id == org,
                BusinessService.criticality.in_(
                    (BusinessServiceCriticality.CRITICAL, BusinessServiceCriticality.HIGH)
                ),
            )
        )
        or 0
    )
    services_with_gaps = (
        db.scalar(
            select(func.count(func.distinct(ResilienceAssessment.business_service_id))).where(
                ResilienceAssessment.financial_entity_id == org,
                ResilienceAssessment.has_gaps.is_(True),
            )
        )
        or 0
    )
    high_findings = (
        db.scalar(
            select(func.count(ResilienceFinding.id)).where(
                ResilienceFinding.financial_entity_id == org,
                ResilienceFinding.severity.in_(
                    (FindingSeverity.HIGH, FindingSeverity.CRITICAL)
                ),
                ResilienceFinding.status != FindingStatus.RESOLVED,
            )
        )
        or 0
    )
    open_findings = (
        db.scalar(
            select(func.count(ResilienceFinding.id)).where(
                ResilienceFinding.financial_entity_id == org,
                ResilienceFinding.status.in_(
                    (FindingStatus.OPEN, FindingStatus.IN_PROGRESS)
                ),
            )
        )
        or 0
    )
    open_remediations = (
        db.scalar(
            select(func.count(RemediationAction.id)).where(
                RemediationAction.financial_entity_id == org,
                RemediationAction.status.in_(
                    (
                        RemediationStatus.OPEN,
                        RemediationStatus.IN_PROGRESS,
                        RemediationStatus.BLOCKED,
                    )
                ),
            )
        )
        or 0
    )
    cloud_resources = (
        db.scalar(
            select(func.count(CloudResource.id)).where(
                CloudResource.financial_entity_id == org
            )
        )
        or 0
    )
    passed = (
        db.scalar(
            select(func.count(RecoveryTest.id)).where(
                RecoveryTest.financial_entity_id == org,
                RecoveryTest.outcome == RecoveryTestOutcome.PASS,
            )
        )
        or 0
    )
    failed = (
        db.scalar(
            select(func.count(RecoveryTest.id)).where(
                RecoveryTest.financial_entity_id == org,
                RecoveryTest.outcome == RecoveryTestOutcome.FAIL,
            )
        )
        or 0
    )
    not_run = (
        db.scalar(
            select(func.count(RecoveryTest.id)).where(
                RecoveryTest.financial_entity_id == org,
                RecoveryTest.outcome == RecoveryTestOutcome.NOT_RUN,
            )
        )
        or 0
    )

    def _dora_count(status: DoraControlImplementationStatus) -> int:
        return (
            db.scalar(
                select(func.count(BusinessServiceDoraLink.id)).where(
                    BusinessServiceDoraLink.financial_entity_id == org,
                    BusinessServiceDoraLink.implementation_status == status,
                )
            )
            or 0
        )

    return ResilienceDashboardOut(
        critical_business_services=critical,
        services_with_gaps=services_with_gaps,
        high_findings=high_findings,
        open_findings=open_findings,
        open_remediations=open_remediations,
        cloud_resources=cloud_resources,
        recovery_tests_passed=passed,
        recovery_tests_failed=failed,
        recovery_tests_not_run=not_run,
        dora_implemented=_dora_count(DoraControlImplementationStatus.IMPLEMENTED),
        dora_partial=_dora_count(DoraControlImplementationStatus.PARTIALLY_IMPLEMENTED),
        dora_not_implemented=_dora_count(DoraControlImplementationStatus.NOT_IMPLEMENTED),
        dora_insufficient_evidence=_dora_count(
            DoraControlImplementationStatus.INSUFFICIENT_EVIDENCE
        ),
        dora_not_assessed=_dora_count(DoraControlImplementationStatus.NOT_ASSESSED),
    )
