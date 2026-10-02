import { describe, expect, it } from "vitest";
import type { ModuleNavMode } from "./moduleNav";
import { modulePageAccessAllowed } from "./moduleNav";

/** Mirrors ModuleGate. */
function modulePageBlocked(
  mode: ModuleNavMode,
  modules: Parameters<typeof modulePageAccessAllowed>[1],
  moduleKey: string | undefined,
  applicabilityModules?: Parameters<typeof modulePageAccessAllowed>[3],
): boolean {
  return !modulePageAccessAllowed(mode, modules, moduleKey, applicabilityModules);
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
  ] as NonNullable<Parameters<typeof modulePageAccessAllowed>[1]>;

  it("does not block while module nav is pending", () => {
    expect(modulePageBlocked("pending", undefined, "ASSET_MANAGEMENT")).toBe(false);
    expect(modulePageBlocked("pending", [], "ASSET_MANAGEMENT")).toBe(false);
  });

  it("does not block on module nav error", () => {
    expect(modulePageBlocked("error", undefined, "ASSET_MANAGEMENT")).toBe(false);
  });

  it("blocks when ready and module is explicitly disabled in /modules", () => {
    const disabled = [{ ...assetModule[0]!, enabled: false }];
    expect(modulePageBlocked("ready", disabled, "ASSET_MANAGEMENT")).toBe(true);
    expect(modulePageBlocked("ready", assetModule, "ASSET_MANAGEMENT")).toBe(false);
  });

  it("does not block when ready with empty /modules (uses fail-open)", () => {
    expect(modulePageBlocked("ready", [], "ASSET_MANAGEMENT")).toBe(false);
  });
});
