import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator

from datetime import date

from app.models.enums import RiskDimensionLevel, RiskLevel
from app.models.enums_operational import RiskLifecycleStatus


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
    title: str | None = None
    owner: str | None = None
    treatment_plan: str | None = None
    due_date: date | None = None
    likelihood: RiskDimensionLevel | None = None
    impact: RiskDimensionLevel | None = None
    lifecycle_status: RiskLifecycleStatus | None = None

    @model_validator(mode="after")
    def at_least_one_target(self):
        if not any([self.provider_id, self.contract_id, self.service_id]):
            raise ValueError("At least one of provider_id, contract_id, service_id required")
        return self


class RiskUpdate(BaseModel):
    title: str | None = None
    owner: str | None = None
    treatment_plan: str | None = None
    due_date: date | None = None
    lifecycle_status: RiskLifecycleStatus | None = None


class RiskOut(BaseModel):
    id: uuid.UUID
    provider_id: uuid.UUID | None
    contract_id: uuid.UUID | None = None
    service_id: uuid.UUID | None = None
    resulting_risk_level: RiskLevel
    inherent_risk_level: RiskLevel | None = None
    residual_risk_level: RiskLevel | None = None
    lifecycle_status: RiskLifecycleStatus
    calculated_at: datetime
    assessor: str
    title: str | None = None
    owner: str | None = None
    treatment_plan: str | None = None
    due_date: date | None = None
    likelihood: RiskDimensionLevel | None = None
    impact: RiskDimensionLevel | None = None

    model_config = {"from_attributes": True}
