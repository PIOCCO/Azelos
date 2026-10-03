from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.business_function import BusinessFunction
from app.models.enums import CriticalOrImportant
from app.models.organization_profile import OrganizationProfile
from app.models.profile_rules import ProfileRule
from app.repositories.modules import ModuleRepository
from app.rules.applicability_engine import conditions_match, merge_outcomes
from app.schemas.applicability import (
    ApplicabilityOut,
    ModuleApplicabilityOut,
    ModuleEnableReason,
    ModuleFinalStatus,
    ModuleRuleResult,
)
from app.services.org_module_defaults import ensure_default_module_assignments
from app.services.profile_service import ProfileService


@dataclass
class ApplicabilityResult:
    flags: dict[str, bool] = field(default_factory=dict)
    module_keys: set[str] = field(default_factory=set)
    matched_rules: list[str] = field(default_factory=list)
    enabled_modules: list[str] = field(default_factory=list)
    module_matched_rules: dict[str, list[str]] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "flags": self.flags,
            "module_keys": sorted(self.module_keys),
            "matched_rules": self.matched_rules,
            "enabled_modules": self.enabled_modules,
            "module_matched_rules": self.module_matched_rules,
        }


class ApplicabilityService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id
        self._modules = ModuleRepository(db, organization_id)

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

    def evaluate(self) -> ApplicabilityResult:
        profile = ProfileService(self.db, self.organization_id).get_or_create()
        env = {**self._profile_payload(profile), **self._context()}
        result = ApplicabilityResult()
        module_rules: dict[str, list[str]] = defaultdict(list)

        rules = self.db.scalars(
            select(ProfileRule).where(ProfileRule.active.is_(True)).order_by(ProfileRule.rule_key)
        ).all()
        for rule in rules:
            if conditions_match(rule.conditions, env):
                result.matched_rules.append(rule.rule_key)
                merge_outcomes(rule.outcomes, flags=result.flags, module_keys=result.module_keys)
                module_key_outcomes = rule.outcomes.get("module_keys")
                if isinstance(module_key_outcomes, list):
                    for key in module_key_outcomes:
                        key_str = str(key)
                        if rule.rule_key not in module_rules[key_str]:
                            module_rules[key_str].append(rule.rule_key)

        result.module_matched_rules = {k: sorted(v) for k, v in module_rules.items()}

        enabled_ids = self._modules.enabled_module_ids()
        catalogue = self._modules.list_catalogue()
        result.enabled_modules = [m.key for m in catalogue if m.id in enabled_ids]

        for key in result.module_keys:
            if key not in result.enabled_modules:
                result.flags.setdefault(f"module_{key.lower()}_recommended", True)
        return result

    def module_required_by_rules(self, module_key: str) -> bool:
        return module_key in self.evaluate().module_keys

    def build_response(self) -> ApplicabilityOut:
        ensure_default_module_assignments(self.db, self.organization_id)
        raw = self.evaluate()
        catalogue = self._modules.list_catalogue()
        assignments = self._modules.assignment_map()
        has_assignments = len(assignments) > 0
        applicable_keys = raw.module_keys

        modules_out: list[ModuleApplicabilityOut] = []
        for module in catalogue:
            if module.id in assignments:
                admin_enabled = assignments[module.id]
            else:
                admin_enabled = not has_assignments

            rule_required = module.key in applicable_keys
            recommended_flag = bool(raw.flags.get(f"module_{module.key.lower()}_recommended", False))
            rule_recommended = recommended_flag and not rule_required

            if rule_required:
                rule_result = ModuleRuleResult.REQUIRED
            elif rule_recommended:
                rule_result = ModuleRuleResult.RECOMMENDED
            else:
                rule_result = ModuleRuleResult.NOT_REQUIRED

            effective_enabled = rule_required or admin_enabled
            if rule_required:
                final_status = ModuleFinalStatus.REQUIRED
                enable_reason = ModuleEnableReason.RULES_REQUIRED
                admin_can_disable = False
            elif effective_enabled:
                final_status = ModuleFinalStatus.OPTIONAL
                enable_reason = (
                    ModuleEnableReason.RULES_RECOMMENDED
                    if rule_recommended and admin_enabled
                    else ModuleEnableReason.ADMIN
                )
                admin_can_disable = True
            else:
                final_status = ModuleFinalStatus.NOT_ENABLED
                enable_reason = ModuleEnableReason.NOT_ENABLED
                admin_can_disable = True

            applicable = effective_enabled or (
                not applicable_keys or module.key in applicable_keys
            )

            modules_out.append(
                ModuleApplicabilityOut(
                    key=module.key,
                    name=module.name,
                    description=module.description,
                    available=True,
                    enabled=effective_enabled,
                    applicable=applicable,
                    required=rule_required,
                    disabled=not effective_enabled,
                    rule_result=rule_result,
                    recommended=rule_recommended,
                    admin_enabled=admin_enabled,
                    admin_can_disable=admin_can_disable,
                    final_status=final_status,
                    enable_reason=enable_reason,
                    matched_rules=raw.module_matched_rules.get(module.key, []),
                )
            )

        hints: list[str] = []
        if raw.flags.get("simplified_rmf"):
            hints.append("SIMPLIFIED_RMF")
        if raw.flags.get("enhanced_resilience_requirements"):
            hints.append("ENHANCED_RESILIENCE")
        if raw.flags.get("tlpt_enabled"):
            hints.append("TLPT")

        return ApplicabilityOut(
            organization_id=self.organization_id,
            features=raw.flags,
            modules=modules_out,
            rules=raw.matched_rules,
            requirements_hint=hints,
        )
