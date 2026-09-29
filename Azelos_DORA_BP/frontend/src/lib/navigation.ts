import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardCheck,
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
} from "lucide-react";
import type { ModuleApplicability } from "../api/types";
import { moduleAllowsAccess } from "./nav";

export interface NavLinkItem {
  label: string;
  path: string;
  icon: LucideIcon;
  moduleKey?: string;
  stub?: boolean;
  adminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavLinkItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Organization", path: "/onboarding/profile", icon: Building2 },
    ],
  },
  {
    title: "DORA",
    items: [
      { label: "ICT Risk Management", path: "/risks", icon: ShieldAlert, moduleKey: "ICT_RISK" },
      { label: "ICT Assets", path: "/ict-assets", icon: HardDrive, moduleKey: "ASSET_MANAGEMENT" },
      { label: "Information Assets", path: "/information-assets", icon: FileStack, moduleKey: "ASSET_MANAGEMENT" },
      { label: "Incidents", path: "/incidents", icon: Shield, moduleKey: "INCIDENT_MANAGEMENT", stub: true },
      { label: "ICT Third-Party Providers", path: "/ict-providers", icon: Link2, moduleKey: "THIRD_PARTY_RISK" },
      { label: "ICT Services", path: "/ict-services", icon: Server, moduleKey: "THIRD_PARTY_RISK" },
      { label: "Contracts", path: "/contracts", icon: FolderKanban, moduleKey: "THIRD_PARTY_RISK" },
      { label: "Sub-outsourcing", path: "/sub-outsourcing", icon: Layers, moduleKey: "THIRD_PARTY_RISK" },
      { label: "Controls", path: "/controls", icon: Shield, moduleKey: "ICT_RISK" },
    ],
  },
  {
    title: "Organization",
    items: [
      { label: "Business Functions", path: "/business-functions", icon: Home, moduleKey: "ASSET_MANAGEMENT" },
      { label: "Applicability", path: "/onboarding/applicability", icon: ClipboardCheck },
    ],
  },
  {
    title: "Resilience",
    items: [
      { label: "Business Continuity", path: "/business-continuity", icon: Shield, moduleKey: "BUSINESS_CONTINUITY", stub: true },
      { label: "Disaster Recovery", path: "/disaster-recovery", icon: HardDrive, moduleKey: "DISASTER_RECOVERY", stub: true },
      { label: "Resilience Testing", path: "/resilience-tests", icon: ShieldAlert, moduleKey: "RESILIENCE_TESTING", stub: true },
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
    title: "Administration",
    items: [
      { label: "Modules", path: "/configuration/modules", icon: Sliders, adminOnly: true },
      { label: "Custom Fields", path: "/configuration/custom-fields", icon: Wrench, adminOnly: true },
      { label: "Settings", path: "/onboarding/applicability", icon: Settings },
    ],
  },
];

export function filterNavSections(
  sections: NavSection[],
  modules: ModuleApplicability[] | undefined,
  isAdmin: boolean,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        return moduleAllowsAccess(modules, item.moduleKey);
      }),
    }))
    .filter((s) => s.items.length > 0);
}
