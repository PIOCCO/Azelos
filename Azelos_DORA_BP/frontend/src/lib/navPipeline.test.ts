import { describe, expect, it } from "vitest";
import { traceNavPipeline } from "./navPipeline";
import type { ModuleApplicability } from "../api/types";

const enabled = (key: string): ModuleApplicability => ({
  key,
  name: key,
  description: null,
  available: true,
  enabled: true,
  applicable: true,
  required: false,
  disabled: false,
});

describe("traceNavPipeline", () => {
  it("shows module filter as the stage that removes gated DORA links", () => {
    const allEnabled = [
      "ICT_RISK",
      "THIRD_PARTY_RISK",
      "ASSET_MANAGEMENT",
      "INCIDENT_MANAGEMENT",
      "EVIDENCE_MANAGEMENT",
      "BUSINESS_CONTINUITY",
      "DISASTER_RECOVERY",
      "RESILIENCE_TESTING",
    ].map(enabled);

    const ready = traceNavPipeline({
      modules: allEnabled,
      moduleNavMode: "ready",
      isAdmin: true,
      role: "ORG_ADMIN",
    });
    const pending = traceNavPipeline({
      modules: undefined,
      moduleNavMode: "pending",
      isAdmin: true,
      role: "ORG_ADMIN",
    });

    const allCount = ready[0].count;
    const readyFinal = ready[ready.length - 1].count;
    const pendingFinal = pending[pending.length - 1].count;

    expect(allCount).toBeGreaterThan(30);
    expect(readyFinal).toBeGreaterThan(pendingFinal);
    expect(ready.find((s) => s.stage === "AFTER_MODULE_FILTER")!.count).toBeGreaterThan(
      pending.find((s) => s.stage === "AFTER_MODULE_FILTER")!.count,
    );
  });
});
