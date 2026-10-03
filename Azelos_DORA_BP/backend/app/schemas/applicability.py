import uuid
from enum import Enum

from pydantic import BaseModel, Field


class ModuleRuleResult(str, Enum):
    REQUIRED = "required"
    RECOMMENDED = "recommended"
    NOT_REQUIRED = "not_required"


class ModuleFinalStatus(str, Enum):
    REQUIRED = "required"
    OPTIONAL = "optional"
    NOT_ENABLED = "not_enabled"


class ModuleEnableReason(str, Enum):
    RULES_REQUIRED = "required_by_applicability_rules"
    RULES_RECOMMENDED = "recommended_by_applicability_rules"
    ADMIN = "enabled_by_organization_administrator"
    NOT_ENABLED = "not_enabled"


class ModuleApplicabilityOut(BaseModel):
    key: str
    name: str
    description: str | None = None
    available: bool = True
    enabled: bool
    applicable: bool
    required: bool
    disabled: bool
    rule_result: ModuleRuleResult
    recommended: bool = False
    admin_enabled: bool
    admin_can_disable: bool = True
    final_status: ModuleFinalStatus
    enable_reason: ModuleEnableReason
    matched_rules: list[str] = Field(default_factory=list)


class ApplicabilityOut(BaseModel):
    organization_id: uuid.UUID
    features: dict[str, bool] = Field(default_factory=dict, description="Rule-derived feature flags")
    modules: list[ModuleApplicabilityOut] = Field(default_factory=list)
    rules: list[str] = Field(default_factory=list, description="Matched profile rule keys")
    requirements_hint: list[str] = Field(
        default_factory=list,
        description="Requirement codes influenced by applicability (informational)",
    )
