import type { ModuleApplicability } from "../api/types";
import { moduleAllowsAccess } from "./nav";

/** Module list used for sidebar filtering — independent of profile/org entity loading. */
export type ModuleNavMode = "pending" | "ready" | "error";

/** Prefer org /modules when non-empty; otherwise applicability. Undefined → caller may fail-open. */
export function resolveModuleListForAccess(
  mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  applicabilityModules?: ModuleApplicability[] | undefined,
): ModuleApplicability[] | undefined {
  if (mode === "ready" && modules !== undefined && modules.length > 0) {
    return modules;
  }
  if (applicabilityModules !== undefined && applicabilityModules.length > 0) {
    return applicabilityModules;
  }
  return undefined;
}

/**
 * Whether a module-gated nav item or page should be shown.
 * Empty / missing module configuration must not hide the whole ICT menu.
 */
export function moduleAccessAllowed(
  mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
  applicabilityModules?: ModuleApplicability[] | undefined,
): boolean {
  if (!moduleKey) return true;

  const primary = mode === "ready" ? modules : undefined;
  const fallback = applicabilityModules;

  if (primary !== undefined && primary.length > 0) {
    const hasKey = primary.some((m) => m.key === moduleKey);
    if (hasKey) return moduleAllowsAccess(primary, moduleKey);
  }
  if (fallback !== undefined && fallback.length > 0) {
    return moduleAllowsAccess(fallback, moduleKey);
  }
  return true;
}

export function resolveModuleNavMode(input: {
  orgContextEnabled: boolean;
  modulesNavList: ModuleApplicability[] | undefined;
  modulesPending: boolean;
  modulesFailed: boolean;
}): ModuleNavMode {
  if (!input.orgContextEnabled) return "pending";
  if (input.modulesNavList !== undefined) return "ready";
  if (input.modulesPending) return "pending";
  if (input.modulesFailed) return "error";
  return "pending";
}

/**
 * Sidebar module filter. While /modules is loading, use applicability when available.
 * Do not treat "still loading" as "module disabled" (that emptied the DORA ICT nav).
 */
export function moduleNavItemVisible(
  mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
  applicabilityModules?: ModuleApplicability[] | undefined,
): boolean {
  return moduleAccessAllowed(mode, modules, moduleKey, applicabilityModules);
}
