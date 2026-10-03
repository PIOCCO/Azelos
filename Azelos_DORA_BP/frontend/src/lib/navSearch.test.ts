import { describe, expect, it } from "vitest";
import en from "../i18n/translations/en";
import { createTranslator } from "../i18n/translate";
import { bestNavigationMatch, searchNavigation } from "./navSearch";

const t = createTranslator(en);

describe("navSearch", () => {
  const base = { isAdmin: true, role: "ORG_ADMIN" as const, t };

  it("matches language to settings language route", () => {
    const hit = bestNavigationMatch("language", base);
    expect(hit?.entry.route).toBe("/settings/language");
  });

  it("matches French langue to language settings", () => {
    const hit = bestNavigationMatch("langue", base);
    expect(hit?.entry.route).toBe("/settings/language");
  });

  it("matches partial lang to language settings", () => {
    const hit = bestNavigationMatch("lang", base);
    expect(hit?.entry.route).toBe("/settings/language");
  });

  it("matches profil to organization profile", () => {
    const hit = bestNavigationMatch("profil", base);
    expect(hit?.entry.route).toBe("/organization/profile");
  });

  it("matches security to users access for admins", () => {
    const hit = bestNavigationMatch("sécurité", base);
    expect(hit?.entry.route).toBe("/settings/access");
  });

  it("does not return spurious matches for nonsense", () => {
    const hits = searchNavigation("zzzxxyyqq", base);
    expect(hits.length).toBe(0);
  });

  it("allows non-admin to find language settings", () => {
    const hit = bestNavigationMatch("langue", { ...base, isAdmin: false });
    expect(hit?.entry.route).toBe("/settings/language");
  });
});
