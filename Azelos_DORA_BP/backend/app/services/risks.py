from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.enums import RiskDimensionLevel, RiskLevel

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


class RiskService:
    CALC_VERSION = "v1-simple-max-dimension"

    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = RiskRepository(db, organization_id)

    def list(self, page: int, page_size: int):
        return self.repo.list_paginated(page, page_size)

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
        peak = max(levels, key=lambda x: _DIMENSION_ORDER[x])
        mapped = {
            RiskDimensionLevel.VERY_LOW: RiskLevel.LOW,
            RiskDimensionLevel.LOW: RiskLevel.LOW,
            RiskDimensionLevel.MEDIUM: RiskLevel.MEDIUM,
            RiskDimensionLevel.HIGH: RiskLevel.HIGH,
            RiskDimensionLevel.VERY_HIGH: RiskLevel.CRITICAL,
        }[peak]
        return self.repo.create(
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
                resulting_risk_level=mapped,
                assessor=data.assessor,
                rationale=data.rationale,
            )
        )
