import type { ModuleApplicability } from "../api/types";
import { moduleAllowsAccess, moduleOrganizationEnabled } from "./nav";

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

/** Sidebar: always list workflow routes; org module toggles only hide when explicitly disabled. */
export function moduleNavSidebarItemVisible(
  _mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
  applicabilityModules?: ModuleApplicability[] | undefined,
): boolean {
  if (!moduleKey) return true;

  const lists: ModuleApplicability[][] = [];
  if (modules !== undefined && modules.length > 0) lists.push(modules);
  if (applicabilityModules !== undefined && applicabilityModules.length > 0) {
    lists.push(applicabilityModules);
  }
  if (lists.length === 0) return true;

  return lists.some((list) => moduleOrganizationEnabled(list, moduleKey));
}

/** Route content: enabled org module from /modules or applicability; open while config loads. */
export function modulePageAccessAllowed(
  mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
  applicabilityModules?: ModuleApplicability[] | undefined,
): boolean {
  if (!moduleKey) return true;
  return moduleNavSidebarItemVisible(mode, modules, moduleKey, applicabilityModules);
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
