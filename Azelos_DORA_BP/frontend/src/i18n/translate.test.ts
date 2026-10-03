import { describe, expect, it } from "vitest";
import { createTranslator, getNested } from "./translate";
import en from "./translations/en";

describe("i18n translate", () => {
  const t = createTranslator(en);

  it("resolves nested keys", () => {
    expect(getNested(en, "nav.dashboard")).toBe("Dashboard");
    expect(t("nav.dashboard")).toBe("Dashboard");
  });

  it("interpolates variables", () => {
    expect(t("common.pageOfTotal", { page: 1, totalPages: 3, total: 42 })).toContain("1");
  });

  it("defaults to English nav labels", () => {
    expect(t("nav.businessFunctions")).toBe("Business Functions");
  });
});
