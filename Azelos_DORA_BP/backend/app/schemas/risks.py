import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator

from app.models.enums import RiskDimensionLevel, RiskLevel


class RiskCreate(BaseModel):
    provider_id: uuid.UUID | None = None
    contract_id: uuid.UUID | None = None
    service_id: uuid.UUID | None = None
    criticality: RiskDimensionLevel
    data_sensitivity: RiskDimensionLevel
    substitutability: RiskDimensionLevel
    concentration_risk: RiskDimensionLevel
    geographic_risk: RiskDimensionLevel
    security_assurance: RiskDimensionLevel
    contract_gaps: RiskDimensionLevel
    exit_feasibility: RiskDimensionLevel
    assessor: str
    rationale: str | None = None

    @model_validator(mode="after")
    def at_least_one_target(self):
        if not any([self.provider_id, self.contract_id, self.service_id]):
            raise ValueError("At least one of provider_id, contract_id, service_id required")
        return self


class RiskOut(BaseModel):
    id: uuid.UUID
    provider_id: uuid.UUID | None
    resulting_risk_level: RiskLevel
    calculated_at: datetime
    assessor: str

    model_config = {"from_attributes": True}
