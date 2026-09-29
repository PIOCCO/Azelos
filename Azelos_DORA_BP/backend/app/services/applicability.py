from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.business_function import BusinessFunction
from app.models.enums import CriticalOrImportant
from app.models.organization_profile import OrganizationProfile
from app.models.platform_config import OrganizationModule, PlatformModule
from app.models.profile_rules import ProfileRule
from app.services.profile_service import ProfileService


@dataclass
class ApplicabilityResult:
    flags: dict[str, bool] = field(default_factory=dict)
    module_keys: set[str] = field(default_factory=set)
    matched_rules: list[str] = field(default_factory=list)
    enabled_modules: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "flags": self.flags,
            "module_keys": sorted(self.module_keys),
            "matched_rules": self.matched_rules,
            "enabled_modules": self.enabled_modules,
        }


class ApplicabilityService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def _profile_payload(self, profile: OrganizationProfile) -> dict[str, Any]:
        return {
            "organization_type": profile.organization_type.value,
            "size_category": profile.size_category.value,
            "regulatory_status": profile.regulatory_status.value,
            "art16_eligible": profile.art16_eligible,
            "has_critical_functions": profile.has_critical_functions,
            "tlpt_applicable": profile.tlpt_applicable,
        }

    def _context(self) -> dict[str, Any]:
        critical_values = (CriticalOrImportant.CRITICAL, CriticalOrImportant.IMPORTANT)
        any_critical = self.db.scalar(
            select(BusinessFunction.id)
            .where(
                BusinessFunction.financial_entity_id == self.organization_id,
                BusinessFunction.critical_or_important.in_(critical_values),
            )
            .limit(1)
        )
        return {"any_critical_business_function": any_critical is not None}

    @staticmethod
    def _conditions_match(conditions: dict[str, Any], env: dict[str, Any]) -> bool:
        for key, expected in conditions.items():
            if env.get(key) != expected:
                return False
        return True

    def evaluate(self) -> ApplicabilityResult:
        profile = ProfileService(self.db, self.organization_id).get_or_create()
        env = {**self._profile_payload(profile), **self._context()}
        result = ApplicabilityResult()

        rules = self.db.scalars(
            select(ProfileRule).where(ProfileRule.active.is_(True)).order_by(ProfileRule.rule_key)
        ).all()
        for rule in rules:
            if self._conditions_match(rule.conditions, env):
                result.matched_rules.append(rule.rule_key)
                for key, val in rule.outcomes.items():
                    if key == "module_keys" and isinstance(val, list):
                        result.module_keys.update(str(v) for v in val)
                    elif isinstance(val, bool):
                        result.flags[key] = val
                    elif key not in ("module_keys",):
                        result.flags[key] = bool(val)

        enabled = self.db.scalars(
            select(PlatformModule.key)
            .join(OrganizationModule, OrganizationModule.platform_module_id == PlatformModule.id)
            .where(
                OrganizationModule.financial_entity_id == self.organization_id,
                OrganizationModule.enabled.is_(True),
            )
        ).all()
        result.enabled_modules = list(enabled)
        for key in result.module_keys:
            if key not in result.enabled_modules:
                result.flags.setdefault(f"module_{key.lower()}_recommended", True)
        return result
