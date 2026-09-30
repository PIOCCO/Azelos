import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums_operational import (
    ContinuityPlanStatus,
    ResilienceTestKind,
    ResilienceTestStatus,
    TlptExerciseStatus,
)


class ResilienceTestCreate(BaseModel):
    title: str = Field(max_length=512)
    test_kind: ResilienceTestKind
    scenario: str | None = None
    scope_summary: str | None = None
    owner: str | None = None
    planned_date: date | None = None
    business_service_id: uuid.UUID | None = None
    ict_asset_id: uuid.UUID | None = None


class ResilienceTestUpdate(BaseModel):
    title: str | None = None
    status: ResilienceTestStatus | None = None
    scenario: str | None = None
    scope_summary: str | None = None
    owner: str | None = None
    planned_date: date | None = None
    outcome_summary: str | None = None


class ResilienceTestOut(BaseModel):
    id: uuid.UUID
    title: str
    test_kind: ResilienceTestKind
    status: ResilienceTestStatus
    scenario: str | None
    scope_summary: str | None
    owner: str | None
    planned_date: date | None
    executed_at: datetime | None
    outcome_summary: str | None
    business_service_id: uuid.UUID | None
    ict_asset_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TlptCreate(BaseModel):
    name: str = Field(max_length=512)
    scope_summary: str | None = None
    threat_intelligence_summary: str | None = None
    attack_scenario: str | None = None
    owner: str | None = None


class TlptUpdate(BaseModel):
    name: str | None = None
    status: TlptExerciseStatus | None = None
    scope_summary: str | None = None
    threat_intelligence_summary: str | None = None
    attack_scenario: str | None = None
    owner: str | None = None
    final_report_summary: str | None = None


class TlptOut(BaseModel):
    id: uuid.UUID
    name: str
    status: TlptExerciseStatus
    scope_summary: str | None
    threat_intelligence_summary: str | None
    attack_scenario: str | None
    owner: str | None
    started_at: datetime | None
    completed_at: datetime | None
    final_report_summary: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BcpCreate(BaseModel):
    name: str = Field(max_length=512)
    business_service_id: uuid.UUID | None = None
    owner: str | None = None
    rto_minutes: int | None = None
    rpo_minutes: int | None = None
    backup_strategy: str | None = None


class BcpUpdate(BaseModel):
    name: str | None = None
    status: ContinuityPlanStatus | None = None
    owner: str | None = None
    rto_minutes: int | None = None
    rpo_minutes: int | None = None
    backup_strategy: str | None = None
    last_review_at: date | None = None


class BcpOut(BaseModel):
    id: uuid.UUID
    name: str
    status: ContinuityPlanStatus
    business_service_id: uuid.UUID | None
    owner: str | None
    rto_minutes: int | None
    rpo_minutes: int | None
    backup_strategy: str | None
    last_review_at: date | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DrpCreate(BaseModel):
    name: str = Field(max_length=512)
    business_service_id: uuid.UUID | None = None
    owner: str | None = None
    recovery_strategy: str | None = None
    failover_capability: str | None = None


class DrpUpdate(BaseModel):
    name: str | None = None
    status: ContinuityPlanStatus | None = None
    owner: str | None = None
    recovery_strategy: str | None = None
    failover_capability: str | None = None
    last_recovery_test_at: date | None = None


class DrpOut(BaseModel):
    id: uuid.UUID
    name: str
    status: ContinuityPlanStatus
    business_service_id: uuid.UUID | None
    owner: str | None
    recovery_strategy: str | None
    failover_capability: str | None
    last_recovery_test_at: date | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
