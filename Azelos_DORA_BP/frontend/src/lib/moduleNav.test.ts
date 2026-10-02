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
  it("shows gated routes while pending until applicability is available", () => {
    expect(moduleNavItemVisible("pending", undefined, "ICT_RISK")).toBe(true);
  });

  it("filters pending nav using applicability fallback", () => {
    expect(moduleNavItemVisible("pending", undefined, "ICT_RISK", [enabledModule])).toBe(true);
    expect(moduleNavItemVisible("pending", undefined, "INCIDENT_MANAGEMENT", [disabledModule])).toBe(
      false,
    );
  });

  it("shows gated routes on error when no module configuration is available", () => {
    expect(moduleNavItemVisible("error", undefined, "ICT_RISK")).toBe(true);
  });

  it("shows ICT nav when ready but /modules returned an empty list", () => {
    expect(moduleNavItemVisible("ready", [], "ICT_RISK", [enabledModule])).toBe(true);
    expect(moduleNavItemVisible("ready", [], "ICT_RISK")).toBe(true);
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

    const pendingNoAppl = filterNavSections(NAV_SECTIONS, undefined, "pending", true, "ORG_ADMIN")
      .flatMap((s) => s.items).length;
    const pendingWithAppl = filterNavSections(
      NAV_SECTIONS,
      undefined,
      "pending",
      true,
      "ORG_ADMIN",
      allEnabled,
    )
      .flatMap((s) => s.items).length;
    const readyCount = filterNavSections(NAV_SECTIONS, allEnabled, "ready", true, "ORG_ADMIN")
      .flatMap((s) => s.items).length;

    expect(pendingWithAppl).toBe(readyCount);
    expect(pendingNoAppl).toBeGreaterThanOrEqual(readyCount - 5);
    expect(readyCount).toBeGreaterThanOrEqual(30);
  });
});
