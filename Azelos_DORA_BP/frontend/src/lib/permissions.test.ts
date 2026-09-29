import { describe, expect, it } from "vitest";
import { can, isReadOnlyAuditor } from "./permissions";

describe("can", () => {
  it("allows org admin configuration", () => {
    expect(can("ORG_ADMIN", "org.admin")).toBe(true);
    expect(can("USER", "org.admin")).toBe(false);
  });

  it("auditor is read-only hint", () => {
    expect(isReadOnlyAuditor("AUDITOR")).toBe(true);
    expect(can("AUDITOR", "read")).toBe(true);
  });
});
