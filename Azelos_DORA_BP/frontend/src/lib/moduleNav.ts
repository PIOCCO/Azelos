import type { ModuleApplicability } from "../api/types";
import { moduleAllowsAccess } from "./nav";

/** Module list used for sidebar filtering — independent of profile/org entity loading. */
export type ModuleNavMode = "pending" | "ready" | "error";

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
  if (!moduleKey) return true;

  if (mode === "ready") {
    return moduleAllowsAccess(modules, moduleKey);
  }

  if (applicabilityModules !== undefined) {
    return moduleAllowsAccess(applicabilityModules, moduleKey);
  }

  if (mode === "pending") {
    return true;
  }

  return false;
}
