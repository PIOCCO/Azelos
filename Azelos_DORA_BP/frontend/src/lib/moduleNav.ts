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
 * Sidebar module filter. Pending/error: hide module-gated items (never allow-all flash).
 * Ready: enforce backend module rules.
 */
export function moduleNavItemVisible(
  mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
): boolean {
  if (!moduleKey) return true;
  if (mode === "pending" || mode === "error") return false;
  return moduleAllowsAccess(modules, moduleKey);
}
