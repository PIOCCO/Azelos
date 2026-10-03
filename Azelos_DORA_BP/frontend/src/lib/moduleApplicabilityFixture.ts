import type { ModuleApplicability } from "../api/types";

/** Defaults for unit tests and story fixtures. */
export function moduleApplicabilityFixture(
  overrides: Partial<ModuleApplicability> & Pick<ModuleApplicability, "key">,
): ModuleApplicability {
  const enabled = overrides.enabled ?? true;
  return {
    name: overrides.key,
    description: null,
    available: true,
    enabled,
    applicable: overrides.applicable ?? true,
    required: false,
    disabled: !enabled,
    rule_result: "not_required",
    recommended: false,
    admin_enabled: enabled,
    admin_can_disable: true,
    final_status: enabled ? "optional" : "not_enabled",
    enable_reason: enabled
      ? "enabled_by_organization_administrator"
      : "not_enabled",
    matched_rules: [],
    ...overrides,
  };
}
