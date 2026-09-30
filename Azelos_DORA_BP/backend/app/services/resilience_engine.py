"""Rule-based resilience assessment — calculated results, not compliance claims."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cloud_resilience import (
    CloudResource,
    ResilienceAssessment,
    ResilienceAssessmentControl,
    ResilienceFinding,
)
from app.models.enums_resilience import (
    AssessmentResult,
    EvidenceSourceKind,
    FindingSeverity,
    FindingStatus,
    ProvenanceType,
    ResilienceControlArea,
)
from app.services.recovery_test_calc import compute_recovery_outcome


def _map_resource_status(meta: dict | None) -> AssessmentResult:
    if not meta:
        return AssessmentResult.UNKNOWN
    if meta.get("backup_enabled") is True:
        return AssessmentResult.PASS
    if meta.get("backup_enabled") is False:
        return AssessmentResult.FAIL
    return AssessmentResult.UNKNOWN


def run_service_assessment(
    db: Session,
    *,
    organization_id: UUID,
    business_service_id: UUID,
    assessed_by: str,
) -> ResilienceAssessment:
    resources = db.scalars(
        select(CloudResource).where(
            CloudResource.financial_entity_id == organization_id,
            CloudResource.business_service_id == business_service_id,
        )
    ).all()

    assessment = ResilienceAssessment(
        financial_entity_id=organization_id,
        business_service_id=business_service_id,
        assessed_by=assessed_by,
    )
    db.add(assessment)
    db.flush()

    controls: list[ResilienceAssessmentControl] = []
    gap = False

    areas = [
        ResilienceControlArea.BACKUP,
        ResilienceControlArea.DISASTER_RECOVERY,
        ResilienceControlArea.MONITORING,
        ResilienceControlArea.HIGH_AVAILABILITY,
    ]

    if not resources:
        for area in areas:
            controls.append(
                ResilienceAssessmentControl(
                    assessment_id=assessment.id,
                    control_area=area,
                    result=AssessmentResult.UNKNOWN,
                    rationale="No cloud resources linked to this business service.",
                    source_kind=EvidenceSourceKind.CALCULATED,
                )
            )
        gap = True
    else:
        for res in resources:
            meta = res.metadata_ or {}
            backup_result = _map_resource_status(meta)
            dr_result = AssessmentResult.UNKNOWN
            if meta.get("geo_redundant") is True:
                dr_result = AssessmentResult.PASS
            elif meta.get("geo_redundant") is False:
                dr_result = AssessmentResult.FAIL

            for area, result, rationale in (
                (
                    ResilienceControlArea.BACKUP,
                    backup_result,
                    f"Resource {res.name}: backup flag from discovered metadata.",
                ),
                (
                    ResilienceControlArea.DISASTER_RECOVERY,
                    dr_result,
                    f"Resource {res.name}: geo-redundancy from discovered metadata.",
                ),
                (
                    ResilienceControlArea.MONITORING,
                    AssessmentResult.UNKNOWN,
                    "Monitoring not inferred without discovered metrics.",
                ),
                (
                    ResilienceControlArea.HIGH_AVAILABILITY,
                    AssessmentResult.PARTIAL if res.region else AssessmentResult.UNKNOWN,
                    "Region present; HA topology not fully discovered.",
                ),
            ):
                controls.append(
                    ResilienceAssessmentControl(
                        assessment_id=assessment.id,
                        cloud_resource_id=res.id,
                        control_area=area,
                        result=result,
                        rationale=rationale,
                        source_kind=EvidenceSourceKind.CALCULATED,
                    )
                )
                if result in (AssessmentResult.FAIL, AssessmentResult.UNKNOWN):
                    gap = True

    for c in controls:
        db.add(c)

    assessment.has_gaps = gap
    assessment.summary = (
        "Resilience gaps detected." if gap else "No gaps detected from available evidence."
    )
    db.flush()

    for c in controls:
        if c.result != AssessmentResult.FAIL:
            continue
        db.add(
            ResilienceFinding(
                financial_entity_id=organization_id,
                title=f"Resilience gap: {c.control_area.value.replace('_', ' ')}",
                description=c.rationale,
                severity=FindingSeverity.HIGH,
                status=FindingStatus.OPEN,
                business_service_id=business_service_id,
                cloud_resource_id=c.cloud_resource_id,
                control_area=c.control_area,
                recommendation="Review configuration and attach verified evidence.",
                created_by=assessed_by,
            )
        )

    return assessment


def rto_rpo_gap_minutes(
    target_minutes: int | None, measured_minutes: int | None
) -> int | None:
    if target_minutes is None or measured_minutes is None:
        return None
    return measured_minutes - target_minutes
