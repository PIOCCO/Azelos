import { describe, expect, it } from "vitest";
import { moduleAllowsAccess } from "./nav";
import type { ModuleNavMode } from "./moduleNav";

/** Mirrors ModuleGate: deny only when module nav is ready and access check fails. */
function modulePageBlocked(
  mode: ModuleNavMode,
  modules: Parameters<typeof moduleAllowsAccess>[0],
  moduleKey: string | undefined,
): boolean {
  if (mode !== "ready") return false;
  return !moduleAllowsAccess(modules, moduleKey);
}

describe("module page gate", () => {
  const assetModule = [
    {
      key: "ASSET_MANAGEMENT",
      enabled: true,
      applicable: true,
      required: false,
      available: true,
      disabled: false,
    },
  ] as Parameters<typeof moduleAllowsAccess>[0];

  it("does not block while module nav is pending", () => {
    expect(modulePageBlocked("pending", undefined, "ASSET_MANAGEMENT")).toBe(false);
    expect(modulePageBlocked("pending", [], "ASSET_MANAGEMENT")).toBe(false);
  });

  it("does not block on module nav error", () => {
    expect(modulePageBlocked("error", undefined, "ASSET_MANAGEMENT")).toBe(false);
  });

  it("blocks when ready and module is disabled", () => {
    expect(modulePageBlocked("ready", [], "ASSET_MANAGEMENT")).toBe(true);
    expect(modulePageBlocked("ready", assetModule, "ASSET_MANAGEMENT")).toBe(false);
  });
});
