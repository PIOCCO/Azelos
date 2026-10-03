import { describe, expect, it } from "vitest";
import { deriveOrgModuleNavState } from "./orgModuleNavState";
import { moduleApplicabilityFixture } from "../lib/moduleApplicabilityFixture";

const mod = moduleApplicabilityFixture({ key: "ICT_RISK", name: "ICT risk" });

describe("deriveOrgModuleNavState", () => {
  it("pending until a successful modules/applicability fetch", () => {
    const s = deriveOrgModuleNavState({
      orgContextEnabled: true,
      modulesData: undefined,
      modulesSuccess: false,
      applModules: undefined,
      applSuccess: false,
      modulesFetched: false,
      applFetched: false,
      modulesError: false,
      applError: false,
      modulesFetching: true,
      applFetching: true,
    });
    expect(s.moduleNavMode).toBe("pending");
  });

  it("stays pending when applicability succeeds but /modules is still fetching", () => {
    const s = deriveOrgModuleNavState({
      orgContextEnabled: true,
      modulesData: undefined,
      modulesSuccess: false,
      applModules: [mod],
      applSuccess: true,
      modulesFetched: false,
      applFetched: true,
      modulesError: false,
      applError: false,
      modulesFetching: true,
      applFetching: false,
    });
    expect(s.moduleNavMode).toBe("pending");
    expect(s.modulesNavList).toBeUndefined();
  });

  it("ready with stable list after modules success", () => {
    const s = deriveOrgModuleNavState({
      orgContextEnabled: true,
      modulesData: [mod],
      modulesSuccess: true,
      applModules: undefined,
      applSuccess: false,
      modulesFetched: true,
      applFetched: false,
      modulesError: false,
      applError: false,
      modulesFetching: false,
      applFetching: true,
    });
    expect(s.moduleNavMode).toBe("ready");
    expect(s.modulesNavList).toHaveLength(1);
  });
});
