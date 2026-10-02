import type { ModuleApplicability } from "../api/types";
import { resolveModuleNavMode, type ModuleNavMode } from "../lib/moduleNav";

/** Sidebar module state from successful fetches only — ignores placeholder/stale cache. */
export function deriveOrgModuleNavState(input: {
  orgContextEnabled: boolean;
  modulesData: ModuleApplicability[] | undefined;
  modulesSuccess: boolean;
  applModules: ModuleApplicability[] | undefined;
  applSuccess: boolean;
  modulesFetched: boolean;
  applFetched: boolean;
  modulesError: boolean;
  applError: boolean;
  modulesFetching: boolean;
  applFetching: boolean;
}): { modulesNavList: ModuleApplicability[] | undefined; moduleNavMode: ModuleNavMode } {
  // Never use applicability modules while the org /modules request is still in flight —
  // that caused a full nav flash (applicability) then collapse (modules refetch).
  const modulesEndpointSettled =
    input.modulesFetched && !input.modulesFetching;

  const modulesNavList = input.modulesSuccess
    ? input.modulesData
    : modulesEndpointSettled && input.modulesError && input.applSuccess
      ? input.applModules
      : undefined;

  const awaitingFirstSuccess =
    input.orgContextEnabled &&
    modulesNavList === undefined &&
    (!modulesEndpointSettled || !input.applFetched || input.applFetching);

  const modulesNavFailed =
    input.orgContextEnabled &&
    modulesNavList === undefined &&
    input.modulesFetched &&
    input.applFetched &&
    !input.modulesFetching &&
    !input.applFetching &&
    input.modulesError &&
    input.applError;

  const moduleNavMode = resolveModuleNavMode({
    orgContextEnabled: input.orgContextEnabled,
    modulesNavList,
    modulesPending: awaitingFirstSuccess && !modulesNavFailed,
    modulesFailed: modulesNavFailed,
  });

  return { modulesNavList, moduleNavMode };
}
