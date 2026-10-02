import type { ModuleApplicability } from "../api/types";

export interface NavItem {
  label: string;
  path: string;
  /** When set, item is shown only if this module is enabled and applicable (or required). */
  moduleKey?: string;
  stub?: boolean;
}

export const CORE_NAV: NavItem[] = [
  { label: "Dashboard", path: "/" },
  { label: "Organization profile", path: "/organization/profile" },
  { label: "Applicability", path: "/onboarding/applicability" },
  { label: "Regulatory requirements", path: "/requirements" },
];

export const MODULE_NAV: NavItem[] = [
  { label: "Business functions", path: "/business-functions", moduleKey: "ASSET_MANAGEMENT" },
  { label: "Information assets", path: "/information-assets", moduleKey: "ASSET_MANAGEMENT" },
  { label: "ICT assets", path: "/ict-assets", moduleKey: "ASSET_MANAGEMENT" },
  { label: "ICT providers", path: "/ict-providers", moduleKey: "THIRD_PARTY_RISK" },
  { label: "Contracts", path: "/contracts", moduleKey: "THIRD_PARTY_RISK" },
  { label: "ICT services", path: "/ict-services", moduleKey: "THIRD_PARTY_RISK" },
  { label: "Sub-outsourcing", path: "/sub-outsourcing", moduleKey: "THIRD_PARTY_RISK" },
  { label: "Risks", path: "/risks", moduleKey: "ICT_RISK" },
  { label: "Controls", path: "/controls", moduleKey: "ICT_RISK" },
  { label: "Evidence", path: "/evidence", moduleKey: "EVIDENCE_MANAGEMENT" },
  { label: "Incidents", path: "/incidents", moduleKey: "INCIDENT_MANAGEMENT" },
  { label: "Business continuity", path: "/business-continuity", moduleKey: "BUSINESS_CONTINUITY" },
  { label: "Disaster recovery", path: "/disaster-recovery", moduleKey: "DISASTER_RECOVERY" },
  { label: "Resilience tests", path: "/resilience-tests", moduleKey: "RESILIENCE_TESTING" },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Settings", path: "/settings" },
];

export function moduleAllowsAccess(
  modules: ModuleApplicability[] | undefined,
  moduleKey: string | undefined,
): boolean {
  if (!moduleKey) return true;
  if (modules === undefined) return false;
  const m = modules.find((x) => x.key === moduleKey);
  if (!m) return false;
  if (m.disabled || !m.available) return false;
  return m.enabled && (m.applicable || m.required);
}

export function filterNav(
  items: NavItem[],
  modules: ModuleApplicability[] | undefined,
): NavItem[] {
  return items.filter((item) => moduleAllowsAccess(modules, item.moduleKey));
}
