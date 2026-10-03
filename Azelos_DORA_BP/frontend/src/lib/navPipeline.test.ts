import { describe, expect, it } from "vitest";
import { traceNavPipeline } from "./navPipeline";
import { moduleApplicabilityFixture } from "./moduleApplicabilityFixture";

const enabled = (key: string) => moduleApplicabilityFixture({ key, name: key });

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
    const pendingWithAppl = traceNavPipeline({
      modules: undefined,
      moduleNavMode: "pending",
      isAdmin: true,
      role: "ORG_ADMIN",
      applicabilityModules: allEnabled,
    });

    const allCount = ready[0].count;
    const readyFinal = ready[ready.length - 1].count;
    const pendingFinal = pendingWithAppl[pendingWithAppl.length - 1].count;

    expect(allCount).toBeGreaterThan(30);
    expect(pendingFinal).toBe(readyFinal);
    expect(ready.find((s) => s.stage === "AFTER_MODULE_FILTER")!.count).toBe(
      pendingWithAppl.find((s) => s.stage === "AFTER_MODULE_FILTER")!.count,
    );
  });
});
