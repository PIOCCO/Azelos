import type { Role, ModuleApplicability } from "../api/types";
import type { ModuleNavMode } from "./moduleNav";
import { moduleNavItemVisible } from "./moduleNav";
import { NAV_SECTIONS, type NavLinkItem, type NavSection } from "./navigation";

export type NavPipelineStage = {
  stage: string;
  count: number;
  labels: string[];
};

function flattenLabels(sections: NavSection[]): string[] {
  return sections.flatMap((s) => s.items.map((i) => i.label));
}

/** Trace sidebar filtering stages (for debugging and regression tests). */
export function traceNavPipeline(input: {
  modules: ModuleApplicability[] | undefined;
  moduleNavMode: ModuleNavMode;
  isAdmin: boolean;
  role?: Role;
}): NavPipelineStage[] {
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const stages: NavPipelineStage[] = [
    {
      stage: "ALL_NAV",
      count: allItems.length,
      labels: allItems.map((i) => i.label),
    },
  ];

  let items: NavLinkItem[] = allItems;
  items = items.filter((item) => moduleNavItemVisible(input.moduleNavMode, input.modules, item.moduleKey));
  stages.push({
    stage: "AFTER_MODULE_FILTER",
    count: items.length,
    labels: items.map((i) => i.label),
  });

  items = items.filter((item) => !(item.platformAdminOnly && input.role !== "SUPER_ADMIN"));
  stages.push({
    stage: "AFTER_PLATFORM_ADMIN_FILTER",
    count: items.length,
    labels: items.map((i) => i.label),
  });

  items = items.filter((item) => !(item.adminOnly && !input.isAdmin));
  stages.push({
    stage: "AFTER_ADMIN_FILTER",
    count: items.length,
    labels: items.map((i) => i.label),
  });

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.platformAdminOnly && input.role !== "SUPER_ADMIN") return false;
      if (item.adminOnly && !input.isAdmin) return false;
      return moduleNavItemVisible(input.moduleNavMode, input.modules, item.moduleKey);
    }),
  })).filter((s) => s.items.length > 0);

  stages.push({
    stage: "FINAL_SIDEBAR",
    count: flattenLabels(sections).length,
    labels: flattenLabels(sections),
  });

  return stages;
}
