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
 * Sidebar only: show a link if either /modules or applicability allows it.
 * Prevents ICT items from flashing on load then vanishing when /modules settles
 * ahead of applicability (or the two responses briefly disagree).
 */
export function moduleNavSidebarItemVisible(
  mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
  applicabilityModules?: ModuleApplicability[] | undefined,
): boolean {
  if (!moduleKey) return true;

  const fromModules =
    mode === "ready" && modules !== undefined && modules.length > 0
      ? moduleAllowsAccess(modules, moduleKey)
      : undefined;
  const fromApplicability =
    applicabilityModules !== undefined && applicabilityModules.length > 0
      ? moduleAllowsAccess(applicabilityModules, moduleKey)
      : undefined;

  if (fromModules === true || fromApplicability === true) return true;
  if (fromModules === false && fromApplicability === false) return false;
  if (fromModules === false && fromApplicability === undefined) return false;
  if (fromModules === undefined && fromApplicability === false) return false;
  return true;
}

/** Page gates and non-sidebar checks — single authoritative list with fallback. */
export function moduleNavItemVisible(
  mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
  applicabilityModules?: ModuleApplicability[] | undefined,
): boolean {
  return moduleAccessAllowed(mode, modules, moduleKey, applicabilityModules);
}
