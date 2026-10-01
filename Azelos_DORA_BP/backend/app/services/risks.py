from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.enums import AuditAction, RiskDimensionLevel, RiskLevel
from app.models.enums_operational import RiskLifecycleStatus
from app.services.platform_audit import record_platform_audit

_DIMENSION_ORDER = {
    RiskDimensionLevel.VERY_LOW: 0,
    RiskDimensionLevel.LOW: 1,
    RiskDimensionLevel.MEDIUM: 2,
    RiskDimensionLevel.HIGH: 3,
    RiskDimensionLevel.VERY_HIGH: 4,
}
from app.models.risk import RiskAssessment
from app.repositories.risks import RiskRepository
from app.schemas.risks import RiskCreate


def _level_from_dimensions(*levels: RiskDimensionLevel) -> RiskLevel:
    peak = max(levels, key=lambda x: _DIMENSION_ORDER[x])
    return {
        RiskDimensionLevel.VERY_LOW: RiskLevel.LOW,
        RiskDimensionLevel.LOW: RiskLevel.LOW,
        RiskDimensionLevel.MEDIUM: RiskLevel.MEDIUM,
        RiskDimensionLevel.HIGH: RiskLevel.HIGH,
        RiskDimensionLevel.VERY_HIGH: RiskLevel.CRITICAL,
    }[peak]


class RiskService:
    CALC_VERSION = "v2-inherent-residual"

    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = RiskRepository(db, organization_id)

    def list(self, page: int, page_size: int, *, q: str | None = None):
        return self.repo.list_paginated(page, page_size, q=q)

    def get(self, risk_id: UUID) -> RiskAssessment:
        row = self.repo.get(risk_id)
        if row is None:
            raise AppError("NOT_FOUND", "Risk assessment not found", 404)
        return row

    def create(self, data: RiskCreate) -> RiskAssessment:
        levels = [
            data.criticality,
            data.data_sensitivity,
            data.substitutability,
            data.concentration_risk,
            data.geographic_risk,
            data.security_assurance,
            data.contract_gaps,
            data.exit_feasibility,
        ]
        residual = _level_from_dimensions(*levels)
        inherent = residual
        if data.likelihood and data.impact:
            inherent = _level_from_dimensions(data.likelihood, data.impact)
        row = self.repo.create(
            RiskAssessment(
                provider_id=data.provider_id,
                contract_id=data.contract_id,
                service_id=data.service_id,
                criticality=data.criticality,
                data_sensitivity=data.data_sensitivity,
                substitutability=data.substitutability,
                concentration_risk=data.concentration_risk,
                geographic_risk=data.geographic_risk,
                security_assurance=data.security_assurance,
                contract_gaps=data.contract_gaps,
                exit_feasibility=data.exit_feasibility,
                calculation_version=self.CALC_VERSION,
                resulting_risk_level=residual,
                inherent_risk_level=inherent,
                residual_risk_level=residual,
                assessor=data.assessor,
                rationale=data.rationale,
                title=data.title,
                owner=data.owner,
                treatment_plan=data.treatment_plan,
                due_date=data.due_date,
                likelihood=data.likelihood,
                impact=data.impact,
                lifecycle_status=data.lifecycle_status or RiskLifecycleStatus.ASSESSMENT,
            )
        )
        record_platform_audit(
            self.repo.db,
            organization_id=self.repo.organization_id,
            actor=data.assessor,
            entity_type="RiskAssessment",
            entity_id=row.id,
            action=AuditAction.CREATE,
            new_value={"resulting_risk_level": residual.value},
        )
        return row

    def update_lifecycle(self, risk_id, data, actor: str) -> RiskAssessment:
        from app.schemas.risks import RiskUpdate

        row = self.get(risk_id)
        patch = data.model_dump(exclude_unset=True) if isinstance(data, RiskUpdate) else data
        for k, v in patch.items():
            setattr(row, k, v)
        record_platform_audit(
            self.repo.db,
            organization_id=self.repo.organization_id,
            actor=actor,
            entity_type="RiskAssessment",
            entity_id=row.id,
            action=AuditAction.UPDATE,
            new_value=patch,
        )
        return row
