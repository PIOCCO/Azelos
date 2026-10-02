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
 * Sidebar module filter. Pending: hide gated items (never allow-all flash).
 * Error: fail open so the nav does not collapse to non-module links only.
 * Ready: enforce backend module rules.
 */
export function moduleNavItemVisible(
  mode: ModuleNavMode,
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
): boolean {
  if (!moduleKey) return true;
  if (mode === "pending") return false;
  if (mode === "error") return true;
  return moduleAllowsAccess(modules, moduleKey);
}
