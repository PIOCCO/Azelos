import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardCheck,
  Cloud,
  FileStack,
  FolderKanban,
  HardDrive,
  Home,
  Layers,
  LayoutDashboard,
  Link2,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  Wrench,
  Activity,
  AlertTriangle,
  CheckSquare,
  FileBarChart,
} from "lucide-react";
import type { ModuleApplicability, Role } from "../api/types";
import type { ModuleNavMode } from "./moduleNav";

export interface NavLinkItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  moduleKey?: string;
  stub?: boolean;
  adminOnly?: boolean;
  /** Visible only to SUPER_ADMIN (platform operator). */
  platformAdminOnly?: boolean;
}

export interface NavSection {
  titleKey: string;
  items: NavLinkItem[];
}

/** Sidebar layout aligned with enterprise DORA nav (Main → DORA → Organization → Compliance). */
export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "nav.sections.main",
    items: [
      { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard },
      { labelKey: "nav.getStarted", path: "/onboarding", icon: ClipboardCheck },
      { labelKey: "nav.organizationProfile", path: "/organization/profile", icon: Building2 },
    ],
  },
  {
    titleKey: "nav.sections.dora",
    items: [
      { labelKey: "nav.doraOverview", path: "/dora/overview", icon: LayoutDashboard },
      { labelKey: "nav.relationshipMap", path: "/dora/relationship-map", icon: Link2 },
      { labelKey: "nav.ictRisk", path: "/risks", icon: ShieldAlert, moduleKey: "ICT_RISK" },
      { labelKey: "nav.ictProviders", path: "/ict-providers", icon: Link2, moduleKey: "THIRD_PARTY_RISK" },
      { labelKey: "nav.ictServices", path: "/ict-services", icon: Server, moduleKey: "THIRD_PARTY_RISK" },
      { labelKey: "nav.contracts", path: "/contracts", icon: FolderKanban, moduleKey: "THIRD_PARTY_RISK" },
      { labelKey: "nav.subOutsourcing", path: "/sub-outsourcing", icon: Layers, moduleKey: "THIRD_PARTY_RISK" },
      { labelKey: "nav.controls", path: "/controls", icon: Shield, moduleKey: "ICT_RISK" },
      { labelKey: "nav.ictAssets", path: "/ict-assets", icon: HardDrive, moduleKey: "ASSET_MANAGEMENT" },
      { labelKey: "nav.informationAssets", path: "/information-assets", icon: FileStack, moduleKey: "ASSET_MANAGEMENT" },
      { labelKey: "nav.incidents", path: "/incidents", icon: Shield, moduleKey: "INCIDENT_MANAGEMENT" },
      { labelKey: "nav.tlpt", path: "/tlpt", icon: ShieldAlert, moduleKey: "INCIDENT_MANAGEMENT" },
    ],
  },
  {
    titleKey: "nav.sections.organization",
    items: [
      { labelKey: "nav.applicability", path: "/onboarding/applicability", icon: ClipboardCheck },
      { labelKey: "nav.businessFunctions", path: "/business-functions", icon: Home, moduleKey: "ASSET_MANAGEMENT" },
      { labelKey: "nav.bia", path: "/bia", icon: Activity, moduleKey: "ASSET_MANAGEMENT" },
      { labelKey: "nav.dependencies", path: "/dependencies", icon: Link2, moduleKey: "ASSET_MANAGEMENT" },
      { labelKey: "nav.team", path: "/settings/access", icon: Settings, adminOnly: true },
    ],
  },
  {
    titleKey: "nav.sections.compliance",
    items: [
      { labelKey: "nav.requirements", path: "/requirements", icon: ClipboardCheck },
      { labelKey: "nav.evidence", path: "/evidence", icon: FileStack, moduleKey: "EVIDENCE_MANAGEMENT" },
    ],
  },
  {
    titleKey: "nav.sections.resilience",
    items: [
      { labelKey: "nav.businessServices", path: "/business-services", icon: Activity },
      { labelKey: "nav.cloudEnvironment", path: "/cloud-environment", icon: Cloud },
      { labelKey: "nav.resilience", path: "/resilience", icon: ShieldAlert },
      { labelKey: "nav.findings", path: "/findings", icon: AlertTriangle },
      { labelKey: "nav.remediation", path: "/remediation", icon: CheckSquare },
      { labelKey: "nav.resilienceEvidence", path: "/resilience-evidence", icon: FileStack },
      { labelKey: "nav.recoveryTests", path: "/recovery-tests", icon: Activity },
      { labelKey: "nav.reports", path: "/reports", icon: FileBarChart },
      { labelKey: "nav.businessContinuity", path: "/business-continuity", icon: Shield, moduleKey: "BUSINESS_CONTINUITY" },
      { labelKey: "nav.disasterRecovery", path: "/disaster-recovery", icon: HardDrive, moduleKey: "DISASTER_RECOVERY" },
      { labelKey: "nav.resilienceTesting", path: "/resilience-tests", icon: ShieldAlert, moduleKey: "RESILIENCE_TESTING" },
    ],
  },
  {
    titleKey: "nav.sections.administration",
    items: [
      { labelKey: "nav.settings", path: "/settings", icon: Settings, adminOnly: true },
      { labelKey: "nav.integrations", path: "/settings/integrations", icon: Link2, adminOnly: true },
      { labelKey: "nav.modules", path: "/settings/dora", icon: Sliders, adminOnly: true },
      { labelKey: "nav.customFields", path: "/settings/custom-fields", icon: Wrench, adminOnly: true },
      { labelKey: "nav.auditLog", path: "/audit-log", icon: ClipboardCheck },
      {
        labelKey: "nav.provisionOrg",
        path: "/admin/provision",
        icon: Settings,
        platformAdminOnly: true,
      },
    ],
  },
];

export function filterNavSections(
  sections: NavSection[],
  _modules: ModuleApplicability[] | undefined,
  _moduleNavMode: ModuleNavMode,
  isAdmin: boolean,
  role?: Role,
  _applicabilityModules?: ModuleApplicability[] | undefined,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.platformAdminOnly && role !== "SUPER_ADMIN") return false;
        if (item.adminOnly && !isAdmin) return false;
        // Do not async-filter workflow links from the sidebar (caused ICT flash then empty).
        // Module keys are enforced on each route via ModuleGate.
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);
}
