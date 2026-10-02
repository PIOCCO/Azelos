import { describe, expect, it } from "vitest";
import { filterNavSections, NAV_SECTIONS } from "./navigation";
import { moduleNavItemVisible, resolveModuleNavMode } from "./moduleNav";
import type { ModuleApplicability } from "../api/types";

const enabledModule: ModuleApplicability = {
  key: "ICT_RISK",
  name: "ICT risk",
  description: null,
  available: true,
  enabled: true,
  applicable: true,
  required: false,
  disabled: false,
};

const disabledModule: ModuleApplicability = {
  ...enabledModule,
  key: "INCIDENT_MANAGEMENT",
  name: "Incidents",
  enabled: false,
};

describe("resolveModuleNavMode", () => {
  it("pending while module list not yet available", () => {
    expect(
      resolveModuleNavMode({
        orgContextEnabled: true,
        modulesNavList: undefined,
        modulesPending: true,
        modulesFailed: false,
      }),
    ).toBe("pending");
  });

  it("ready when module list is available", () => {
    expect(
      resolveModuleNavMode({
        orgContextEnabled: true,
        modulesNavList: [enabledModule],
        modulesPending: false,
        modulesFailed: false,
      }),
    ).toBe("ready");
  });

  it("error when both module sources failed", () => {
    expect(
      resolveModuleNavMode({
        orgContextEnabled: true,
        modulesNavList: undefined,
        modulesPending: false,
        modulesFailed: true,
      }),
    ).toBe("error");
  });
});

describe("moduleNavItemVisible", () => {
  it("hides gated routes while pending (no allow-all flash)", () => {
    expect(moduleNavItemVisible("pending", undefined, "ICT_RISK")).toBe(false);
  });

  it("hides gated routes on error (no fail-open flash)", () => {
    expect(moduleNavItemVisible("error", undefined, "ICT_RISK")).toBe(false);
  });

  it("respects disabled modules when ready", () => {
    expect(moduleNavItemVisible("ready", [disabledModule], "INCIDENT_MANAGEMENT")).toBe(false);
    expect(moduleNavItemVisible("ready", [enabledModule], "ICT_RISK")).toBe(true);
  });
});

describe("filterNavSections stability", () => {
  it("does not shrink DORA section when switching pending → ready with all modules enabled", () => {
    const allEnabled: ModuleApplicability[] = [
      enabledModule,
      { ...enabledModule, key: "THIRD_PARTY_RISK" },
      { ...enabledModule, key: "ASSET_MANAGEMENT" },
      { ...enabledModule, key: "INCIDENT_MANAGEMENT" },
      { ...enabledModule, key: "EVIDENCE_MANAGEMENT" },
      { ...enabledModule, key: "BUSINESS_CONTINUITY" },
      { ...enabledModule, key: "DISASTER_RECOVERY" },
      { ...enabledModule, key: "RESILIENCE_TESTING" },
    ];

    const pendingCount = filterNavSections(NAV_SECTIONS, undefined, "pending", true, "ORG_ADMIN")
      .flatMap((s) => s.items).length;
    const readyCount = filterNavSections(NAV_SECTIONS, allEnabled, "ready", true, "ORG_ADMIN")
      .flatMap((s) => s.items).length;

    expect(readyCount).toBeGreaterThan(pendingCount);
    expect(readyCount).toBeGreaterThanOrEqual(30);
  });
});
