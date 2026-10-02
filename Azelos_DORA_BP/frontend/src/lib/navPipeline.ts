import type { Role, ModuleApplicability } from "../api/types";
import type { ModuleNavMode } from "./moduleNav";
import { filterNavSections, NAV_SECTIONS, type NavSection } from "./navigation";

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
  applicabilityModules?: ModuleApplicability[] | undefined;
}): NavPipelineStage[] {
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const stages: NavPipelineStage[] = [
    {
      stage: "ALL_NAV",
      count: allItems.length,
      labels: allItems.map((i) => i.label),
    },
  ];

  stages.push({
    stage: "AFTER_MODULE_FILTER",
    count: allItems.length,
    labels: allItems.map((i) => i.label),
  });

  const sections = filterNavSections(
    NAV_SECTIONS,
    input.modules,
    input.moduleNavMode,
    input.isAdmin,
    input.role,
    input.applicabilityModules,
  );

  stages.push({
    stage: "FINAL_SIDEBAR",
    count: flattenLabels(sections).length,
    labels: flattenLabels(sections),
  });

  return stages;
}
