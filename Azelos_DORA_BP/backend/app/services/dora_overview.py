from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.business_function import BusinessFunction
from app.models.enums import CriticalOrImportant, RiskLevel
from app.models.evidence import Evidence
from app.models.ict_assets import ICTAsset
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
        incidents_module_available=False,
    )
