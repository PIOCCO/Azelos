from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.business_function import BusinessFunction
from app.models.cloud_resilience import RemediationAction
from app.models.enums import CriticalOrImportant, RiskLevel
from app.models.enums_operational import (
    ContinuityPlanStatus,
    IncidentStatus,
    ResilienceTestStatus,
    TlptExerciseStatus,
)
from app.models.enums_resilience import RemediationStatus
from app.models.evidence import Evidence
from app.models.ict_assets import ICTAsset
from app.models.operational import (
    BusinessContinuityPlan,
    DisasterRecoveryPlan,
    ICTIncident,
    ResilienceTestCampaign,
    TlptExercise,
)
from app.models.provider import ICTProvider
from app.models.risk import RiskAssessment
from app.models.service import ICTService
from app.schemas.dora_overview import DoraOverviewOut
from app.services.resilience_dashboard import build_dashboard


def build_dora_overview(db: Session, organization_id: UUID) -> DoraOverviewOut:
    org = organization_id
    resilience = build_dashboard(db, org)

    bf_total = (
        db.scalar(
            select(func.count(BusinessFunction.id)).where(
                BusinessFunction.financial_entity_id == org
            )
        )
        or 0
    )
    bf_critical = (
        db.scalar(
            select(func.count(BusinessFunction.id)).where(
                BusinessFunction.financial_entity_id == org,
                BusinessFunction.critical_or_important.in_(
                    (CriticalOrImportant.CRITICAL, CriticalOrImportant.IMPORTANT)
                ),
            )
        )
        or 0
    )
    assets_total = (
        db.scalar(
            select(func.count(ICTAsset.id)).where(ICTAsset.financial_entity_id == org)
        )
        or 0
    )
    assets_high = (
        db.scalar(
            select(func.count(ICTAsset.id)).where(
                ICTAsset.financial_entity_id == org,
                ICTAsset.inherent_criticality.in_(
                    (CriticalOrImportant.CRITICAL, CriticalOrImportant.IMPORTANT)
                ),
            )
        )
        or 0
    )
    providers_total = (
        db.scalar(
            select(func.count(ICTProvider.id)).where(
                ICTProvider.financial_entity_id == org
            )
        )
        or 0
    )
    risks_total = (
        db.scalar(
            select(func.count(RiskAssessment.id)).where(
                RiskAssessment.financial_entity_id == org
            )
        )
        or 0
    )
    risks_high = (
        db.scalar(
            select(func.count(RiskAssessment.id)).where(
                RiskAssessment.financial_entity_id == org,
                RiskAssessment.resulting_risk_level.in_(
                    (RiskLevel.HIGH, RiskLevel.CRITICAL)
                ),
            )
        )
        or 0
    )
    evidence_total = (
        db.scalar(
            select(func.count(Evidence.id)).where(Evidence.financial_entity_id == org)
        )
        or 0
    )
    services_critical = (
        db.scalar(
            select(func.count(ICTService.id)).where(
                ICTService.financial_entity_id == org,
                ICTService.supports_critical_or_important.in_(
                    (CriticalOrImportant.CRITICAL, CriticalOrImportant.IMPORTANT)
                ),
            )
        )
        or 0
    )

    open_statuses = (
        IncidentStatus.DETECTED,
        IncidentStatus.CLASSIFIED,
        IncidentStatus.INVESTIGATING,
        IncidentStatus.CONTAINED,
        IncidentStatus.RESOLVED,
    )
    incidents_total = (
        db.scalar(
            select(func.count(ICTIncident.id)).where(
                ICTIncident.financial_entity_id == org,
                ICTIncident.archived_at.is_(None),
            )
        )
        or 0
    )
    incidents_open = (
        db.scalar(
            select(func.count(ICTIncident.id)).where(
                ICTIncident.financial_entity_id == org,
                ICTIncident.archived_at.is_(None),
                ICTIncident.status.in_(open_statuses),
            )
        )
        or 0
    )
    incidents_major_open = (
        db.scalar(
            select(func.count(ICTIncident.id)).where(
                ICTIncident.financial_entity_id == org,
                ICTIncident.archived_at.is_(None),
                ICTIncident.is_major.is_(True),
                ICTIncident.status != IncidentStatus.CLOSED,
            )
        )
        or 0
    )
    tests_planned = (
        db.scalar(
            select(func.count(ResilienceTestCampaign.id)).where(
                ResilienceTestCampaign.financial_entity_id == org,
                ResilienceTestCampaign.archived_at.is_(None),
                ResilienceTestCampaign.status.in_(
                    (ResilienceTestStatus.PLANNED, ResilienceTestStatus.SCOPED)
                ),
            )
        )
        or 0
    )
    tlpt_active = (
        db.scalar(
            select(func.count(TlptExercise.id)).where(
                TlptExercise.financial_entity_id == org,
                TlptExercise.archived_at.is_(None),
                TlptExercise.status != TlptExerciseStatus.CLOSED,
            )
        )
        or 0
    )
    bcp_active = (
        db.scalar(
            select(func.count(BusinessContinuityPlan.id)).where(
                BusinessContinuityPlan.financial_entity_id == org,
                BusinessContinuityPlan.status == ContinuityPlanStatus.ACTIVE,
            )
        )
        or 0
    )
    drp_active = (
        db.scalar(
            select(func.count(DisasterRecoveryPlan.id)).where(
                DisasterRecoveryPlan.financial_entity_id == org,
                DisasterRecoveryPlan.status == ContinuityPlanStatus.ACTIVE,
            )
        )
        or 0
    )
    today = date.today()
    overdue_remediations = (
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
                RemediationAction.due_date.is_not(None),
                RemediationAction.due_date < today,
            )
        )
        or 0
    )
    evidence_expiring = (
        db.scalar(
            select(func.count(Evidence.id)).where(
                Evidence.financial_entity_id == org,
                Evidence.expiry_date.is_not(None),
                Evidence.expiry_date <= today + timedelta(days=30),
                Evidence.expiry_date >= today,
            )
        )
        or 0
    )

    return DoraOverviewOut(
        resilience=resilience,
        business_functions_total=bf_total,
        business_functions_critical=bf_critical,
        ict_assets_total=assets_total,
        ict_assets_high_criticality=assets_high,
        ict_providers_total=providers_total,
        risk_assessments_total=risks_total,
        risk_assessments_high_or_critical=risks_high,
        evidence_items_total=evidence_total,
        ict_services_critical=services_critical,
        incidents_module_available=True,
        incidents_total=incidents_total,
        incidents_open=incidents_open,
        incidents_major_open=incidents_major_open,
        resilience_tests_planned=tests_planned,
        tlpt_exercises_active=tlpt_active,
        bcp_plans_active=bcp_active,
        drp_plans_active=drp_active,
        overdue_remediations=overdue_remediations,
        evidence_expiring_within_30_days=evidence_expiring,
    )
