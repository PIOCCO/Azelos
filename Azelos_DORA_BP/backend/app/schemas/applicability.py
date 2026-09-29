import uuid

from pydantic import BaseModel, Field


class ModuleApplicabilityOut(BaseModel):
    key: str
    name: str
    description: str | None = None
    available: bool = True
    enabled: bool
    applicable: bool
    required: bool
    disabled: bool


class ApplicabilityOut(BaseModel):
    organization_id: uuid.UUID
    features: dict[str, bool] = Field(default_factory=dict, description="Rule-derived feature flags")
    modules: list[ModuleApplicabilityOut] = Field(default_factory=list)
    rules: list[str] = Field(default_factory=list, description="Matched profile rule keys")
    requirements_hint: list[str] = Field(
        default_factory=list,
        description="Requirement codes influenced by applicability (informational)",
    )
