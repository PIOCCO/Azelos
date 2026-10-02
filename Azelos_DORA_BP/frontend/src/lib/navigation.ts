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
  label: string;
  path: string;
  icon: LucideIcon;
  moduleKey?: string;
  stub?: boolean;
  adminOnly?: boolean;
  /** Visible only to SUPER_ADMIN (platform operator). */
  platformAdminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavLinkItem[];
}

/** Sidebar layout aligned with enterprise DORA nav (Main → DORA → Organization → Compliance). */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Get started", path: "/onboarding", icon: ClipboardCheck },
      { label: "Organization profile", path: "/organization/profile", icon: Building2 },
    ],
  },
  {
    title: "DORA",
    items: [
      { label: "DORA Overview", path: "/dora/overview", icon: LayoutDashboard },
      { label: "Relationship Map", path: "/dora/relationship-map", icon: Link2 },
      { label: "ICT Risk Management", path: "/risks", icon: ShieldAlert, moduleKey: "ICT_RISK" },
      { label: "ICT Third-Party Providers", path: "/ict-providers", icon: Link2, moduleKey: "THIRD_PARTY_RISK" },
      { label: "ICT Services", path: "/ict-services", icon: Server, moduleKey: "THIRD_PARTY_RISK" },
      { label: "Contracts", path: "/contracts", icon: FolderKanban, moduleKey: "THIRD_PARTY_RISK" },
      { label: "Sub-outsourcing", path: "/sub-outsourcing", icon: Layers, moduleKey: "THIRD_PARTY_RISK" },
      { label: "Controls", path: "/controls", icon: Shield, moduleKey: "ICT_RISK" },
      { label: "ICT Assets", path: "/ict-assets", icon: HardDrive, moduleKey: "ASSET_MANAGEMENT" },
      { label: "Information Assets", path: "/information-assets", icon: FileStack, moduleKey: "ASSET_MANAGEMENT" },
      { label: "Incidents", path: "/incidents", icon: Shield, moduleKey: "INCIDENT_MANAGEMENT" },
      { label: "TLPT", path: "/tlpt", icon: ShieldAlert, moduleKey: "INCIDENT_MANAGEMENT" },
    ],
  },
  {
    title: "Organization",
    items: [
      { label: "Applicability", path: "/onboarding/applicability", icon: ClipboardCheck },
      { label: "Business Functions", path: "/business-functions", icon: Home, moduleKey: "ASSET_MANAGEMENT" },
      { label: "BIA", path: "/bia", icon: Activity, moduleKey: "ASSET_MANAGEMENT" },
      { label: "Dependencies", path: "/dependencies", icon: Link2, moduleKey: "ASSET_MANAGEMENT" },
      { label: "Team", path: "/settings/access", icon: Settings, adminOnly: true },
    ],
  },
  {
    title: "Compliance",
    items: [
      { label: "Regulatory Requirements", path: "/requirements", icon: ClipboardCheck },
      { label: "Evidence", path: "/evidence", icon: FileStack, moduleKey: "EVIDENCE_MANAGEMENT" },
    ],
  },
  {
    title: "Resilience platform",
    items: [
      { label: "Business Services", path: "/business-services", icon: Activity },
      { label: "Cloud Environment", path: "/cloud-environment", icon: Cloud },
      { label: "Resilience", path: "/resilience", icon: ShieldAlert },
      { label: "Findings", path: "/findings", icon: AlertTriangle },
      { label: "Remediation", path: "/remediation", icon: CheckSquare },
      { label: "Resilience Evidence", path: "/resilience-evidence", icon: FileStack },
      { label: "Recovery Tests", path: "/recovery-tests", icon: Activity },
      { label: "Reports", path: "/reports", icon: FileBarChart },
      { label: "Business Continuity", path: "/business-continuity", icon: Shield, moduleKey: "BUSINESS_CONTINUITY" },
      { label: "Disaster Recovery", path: "/disaster-recovery", icon: HardDrive, moduleKey: "DISASTER_RECOVERY" },
      { label: "Resilience Testing", path: "/resilience-tests", icon: ShieldAlert, moduleKey: "RESILIENCE_TESTING" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Settings", path: "/settings", icon: Settings, adminOnly: true },
      { label: "Integrations", path: "/settings/integrations", icon: Link2, adminOnly: true },
      { label: "Modules", path: "/settings/dora", icon: Sliders, adminOnly: true },
      { label: "Custom Fields", path: "/settings/custom-fields", icon: Wrench, adminOnly: true },
      { label: "Audit log", path: "/audit-log", icon: ClipboardCheck },
      {
        label: "Provision customer org",
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
