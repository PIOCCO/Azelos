import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  getApplicability,
  getOrganization,
  getOrgModules,
  getProfile,
} from "../api/dora";
import type { ApplicabilityResult, ModuleApplicability, OrganizationProfile } from "../api/types";
import { resolveModuleNavMode, type ModuleNavMode } from "../lib/moduleNav";
import { useAuth } from "./AuthContext";

interface OrgContextValue {
  organizationId: string | null;
  organizationName: string | undefined;
  profile: OrganizationProfile | undefined;
  applicability: ApplicabilityResult | undefined;
  modules: ApplicabilityResult["modules"] | undefined;
  /** First resolved module list (modules endpoint or applicability payload). */
  modulesNavList: ModuleApplicability[] | undefined;
  moduleNavMode: ModuleNavMode;
  isLoading: boolean;
  error: Error | null;
  refreshOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const orgId = session?.organizationId ?? null;
  const qc = useQueryClient();

  const enabled = !!orgId && !!session?.token;

  const orgQ = useQuery({
    queryKey: ["org", orgId, "entity"],
    queryFn: () => getOrganization(orgId!),
    enabled,
  });

  const profileQ = useQuery({
    queryKey: ["org", orgId, "profile"],
    queryFn: () => getProfile(orgId!),
    enabled,
  });

  const applQ = useQuery({
    queryKey: ["org", orgId, "applicability"],
    queryFn: () => getApplicability(orgId!),
    enabled,
    placeholderData: (previous) => previous,
  });

  const modulesQ = useQuery({
    queryKey: ["org", orgId, "modules"],
    queryFn: () => getOrgModules(orgId!),
    enabled,
    placeholderData: (previous) => previous,
  });

  const modulesNavList = modulesQ.data ?? applQ.data?.modules;
  const modulesNavPending =
    enabled && modulesNavList === undefined && (modulesQ.isPending || applQ.isPending);
  const modulesNavFailed =
    enabled &&
    modulesNavList === undefined &&
    !modulesNavPending &&
    modulesQ.isError &&
    applQ.isError;

  const moduleNavMode = resolveModuleNavMode({
    orgContextEnabled: enabled,
    modulesNavList,
    modulesPending: modulesNavPending,
    modulesFailed: modulesNavFailed,
  });

  const refreshOrg = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["org", orgId] });
  }, [qc, orgId]);

  const value = useMemo(
    (): OrgContextValue => ({
      organizationId: orgId,
      organizationName: orgQ.data?.short_name ?? orgQ.data?.legal_name,
      profile: profileQ.data,
      applicability: applQ.data,
      modules: modulesQ.data,
      modulesNavList,
      moduleNavMode,
      isLoading:
        orgQ.isLoading || profileQ.isLoading || applQ.isLoading || modulesQ.isLoading,
      error: (profileQ.error ?? applQ.error) as Error | null,
      refreshOrg,
    }),
    [
      orgId,
      orgQ.data,
      profileQ.data,
      applQ.data,
      modulesQ.data,
      modulesNavList,
      moduleNavMode,
      modulesQ.isPending,
      modulesQ.isError,
      applQ.isPending,
      applQ.isError,
      enabled,
      orgQ.isLoading,
      profileQ.isLoading,
      applQ.isLoading,
      modulesQ.isLoading,
      profileQ.error,
      applQ.error,
      refreshOrg,
    ],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("OrgProvider required");
  return ctx;
}

/** Module list for gates — available as soon as modules or applicability responds. */
export function useModuleNav(): ModuleApplicability[] | undefined {
  const { modulesNavList } = useOrg();
  return modulesNavList;
}

export function useModuleNavMode(): ModuleNavMode {
  const { moduleNavMode } = useOrg();
  return moduleNavMode;
}
