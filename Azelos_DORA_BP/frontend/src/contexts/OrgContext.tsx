import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { isPolicyAcceptanceRequired } from "../api/parseApiError";
import {
  getApplicability,
  getOrganization,
  getOrgModules,
  getProfile,
} from "../api/dora";
import type { ApplicabilityResult, ModuleApplicability, OrganizationProfile } from "../api/types";
import type { ModuleNavMode } from "../lib/moduleNav";
import { deriveOrgModuleNavState } from "./orgModuleNavState";
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
  const navigate = useNavigate();
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
  });

  const modulesQ = useQuery({
    queryKey: ["org", orgId, "modules"],
    queryFn: () => getOrgModules(orgId!),
    enabled,
  });

  const { modulesNavList, moduleNavMode } = deriveOrgModuleNavState({
    orgContextEnabled: enabled,
    modulesData: modulesQ.data,
    modulesSuccess: modulesQ.isSuccess,
    applModules: applQ.data?.modules,
    applSuccess: applQ.isSuccess,
    modulesFetched: modulesQ.isFetched,
    applFetched: applQ.isFetched,
    modulesError: modulesQ.isError,
    applError: applQ.isError,
    modulesFetching: modulesQ.isFetching,
    applFetching: applQ.isFetching,
  });

  const refreshOrg = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["org", orgId] });
  }, [qc, orgId]);

  const policyBlock =
    (profileQ.error instanceof ApiError && isPolicyAcceptanceRequired(profileQ.error.code)) ||
    (applQ.error instanceof ApiError && isPolicyAcceptanceRequired(applQ.error.code));

  useEffect(() => {
    if (policyBlock) {
      navigate("/policy-acceptance", { replace: true });
    }
  }, [policyBlock, navigate]);

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
      error: policyBlock
        ? null
        : ((profileQ.error ?? applQ.error) as Error | null),
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
      modulesQ.isSuccess,
      modulesQ.isFetched,
      modulesQ.isError,
      modulesQ.isFetching,
      applQ.isSuccess,
      applQ.isFetched,
      applQ.isError,
      applQ.isFetching,
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
