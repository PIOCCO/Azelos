import { describe, expect, it } from "vitest";
import { detailPathForNode } from "./graphql";

describe("detailPathForNode", () => {
  it("maps risk assessments to detail route", () => {
    expect(
      detailPathForNode({
        id: "RiskAssessment:550e8400-e29b-41d4-a716-446655440000",
        type: "RiskAssessment",
        label: "Risk high",
      }),
    ).toBe("/risks/550e8400-e29b-41d4-a716-446655440000");
  });

  it("returns null for unknown types", () => {
    expect(
      detailPathForNode({ id: "X:1", type: "Unknown", label: "x" }),
    ).toBeNull();
  });
});
