import { describe, expect, it } from "vitest";
import { moduleAllowsAccess, moduleOrganizationEnabled } from "./nav";
import type { ModuleApplicability } from "../api/types";

const modules: ModuleApplicability[] = [
  {
    key: "ICT_RISK",
    name: "ICT risk",
    description: null,
    available: true,
    enabled: true,
    applicable: true,
    required: false,
    disabled: false,
  },
  {
    key: "INCIDENT_MANAGEMENT",
    name: "Incidents",
    description: null,
    available: true,
    enabled: false,
    applicable: true,
    required: false,
    disabled: false,
  },
];

describe("moduleAllowsAccess", () => {
  it("allows enabled applicable modules", () => {
    expect(moduleAllowsAccess(modules, "ICT_RISK")).toBe(true);
  });

  it("denies disabled modules", () => {
    expect(moduleAllowsAccess(modules, "INCIDENT_MANAGEMENT")).toBe(false);
  });

  it("allows routes without module key", () => {
    expect(moduleAllowsAccess(modules, undefined)).toBe(true);
  });

  it("denies module routes when module list is unavailable", () => {
    expect(moduleAllowsAccess(undefined, "ICT_RISK")).toBe(false);
  });
});

describe("moduleOrganizationEnabled", () => {
  it("allows enabled modules even when applicability rules say not applicable", () => {
    const mod = { ...modules[0]!, applicable: false, required: false };
    expect(moduleOrganizationEnabled([mod], "ICT_RISK")).toBe(true);
  });

  it("denies when org disabled the module", () => {
    expect(moduleOrganizationEnabled(modules, "INCIDENT_MANAGEMENT")).toBe(false);
  });
});
