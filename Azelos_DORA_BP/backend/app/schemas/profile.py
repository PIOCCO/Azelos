import uuid

from pydantic import BaseModel, Field

from app.models.enums_profile import (
    OrganizationSizeCategory,
    OrganizationType,
    RegulatoryStatus,
)


class OrganizationProfileOut(BaseModel):
    id: uuid.UUID
    financial_entity_id: uuid.UUID
    organization_type: OrganizationType
    size_category: OrganizationSizeCategory
    regulatory_status: RegulatoryStatus
    art16_eligible: bool
    has_critical_functions: bool
    tlpt_applicable: bool

    model_config = {"from_attributes": True}


class OrganizationProfileUpdate(BaseModel):
    organization_type: OrganizationType | None = None
    size_category: OrganizationSizeCategory | None = None
    regulatory_status: RegulatoryStatus | None = None
    art16_eligible: bool | None = None
    has_critical_functions: bool | None = None
    tlpt_applicable: bool | None = None
