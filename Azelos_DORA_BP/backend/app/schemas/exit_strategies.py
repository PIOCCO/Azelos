from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import ExitStrategyStatus, ExitTestResult


class ExitStrategyCreate(BaseModel):
    business_function_id: UUID
    service_id: UUID
    contract_id: UUID
    provider_id: UUID
    exit_objective: str = Field(min_length=1)
    alternative_provider_name: str | None = None
    migration_strategy: str | None = None
    rto_hours: int | None = None
    rpo_hours: int | None = None
    data_portability_notes: str | None = None
    dependencies_notes: str | None = None
    test_date: date | None = None
    test_result: ExitTestResult = ExitTestResult.NOT_TESTED
    status: ExitStrategyStatus = ExitStrategyStatus.DRAFT
    primary_evidence_id: UUID | None = None


class ExitStrategyUpdate(BaseModel):
    exit_objective: str | None = None
    alternative_provider_name: str | None = None
    migration_strategy: str | None = None
    rto_hours: int | None = None
    rpo_hours: int | None = None
    data_portability_notes: str | None = None
    dependencies_notes: str | None = None
    test_date: date | None = None
    test_result: ExitTestResult | None = None
    status: ExitStrategyStatus | None = None
    primary_evidence_id: UUID | None = None


class ExitStrategyOut(BaseModel):
    id: UUID
    business_function_id: UUID
    service_id: UUID
    contract_id: UUID
    provider_id: UUID
    exit_objective: str
    alternative_provider_name: str | None
    rto_hours: int | None
    rpo_hours: int | None
    test_result: ExitTestResult
    status: ExitStrategyStatus

    model_config = {"from_attributes": True}
