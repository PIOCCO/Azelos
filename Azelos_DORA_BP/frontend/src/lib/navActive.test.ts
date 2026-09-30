import { describe, expect, it } from "vitest";
import { isNavItemActive, navPathMatches, resolveActiveNavPath } from "./navActive";

const NAV_PATHS = [
  "/",
  "/dora/overview",
  "/dora/relationship-map",
  "/risks",
  "/incidents",
  "/ict-providers",
  "/onboarding/applicability",
  "/onboarding/profile",
];

describe("navPathMatches", () => {
  it("does not cross-match sibling DORA routes", () => {
    expect(navPathMatches("/dora/relationship-map", "/dora/overview")).toBe(false);
    expect(navPathMatches("/dora/overview", "/dora/relationship-map")).toBe(false);
  });

  it("matches /dora/overview exactly and as parent of nested routes", () => {
    expect(navPathMatches("/dora/overview", "/dora/overview")).toBe(true);
    expect(navPathMatches("/dora/overview/details", "/dora/overview")).toBe(true);
  });

  it("matches risk detail under /risks", () => {
    expect(navPathMatches("/risks/abc-123", "/risks")).toBe(true);
  });
});

describe("resolveActiveNavPath", () => {
  it("activates only Relationship Map on relationship map route", () => {
    const active = resolveActiveNavPath("/dora/relationship-map", NAV_PATHS);
    expect(active).toBe("/dora/relationship-map");
    expect(isNavItemActive("/dora/relationship-map", "/dora/overview", NAV_PATHS)).toBe(false);
    expect(isNavItemActive("/dora/relationship-map", "/dora/relationship-map", NAV_PATHS)).toBe(true);
  });

  it("activates only DORA Overview on overview route", () => {
    expect(isNavItemActive("/dora/overview", "/dora/overview", NAV_PATHS)).toBe(true);
    expect(isNavItemActive("/dora/overview", "/dora/relationship-map", NAV_PATHS)).toBe(false);
  });

  it("activates only ICT Risk on risks routes", () => {
    expect(isNavItemActive("/risks", "/risks", NAV_PATHS)).toBe(true);
    expect(isNavItemActive("/risks/uuid", "/risks", NAV_PATHS)).toBe(true);
    expect(isNavItemActive("/risks", "/dora/overview", NAV_PATHS)).toBe(false);
  });

  it("activates only Incidents on incidents route", () => {
    expect(isNavItemActive("/incidents", "/incidents", NAV_PATHS)).toBe(true);
    expect(isNavItemActive("/incidents", "/dora/overview", NAV_PATHS)).toBe(false);
  });

  it("picks longest match for nested onboarding paths", () => {
    expect(resolveActiveNavPath("/onboarding/profile", NAV_PATHS)).toBe("/onboarding/profile");
    expect(resolveActiveNavPath("/onboarding/applicability", NAV_PATHS)).toBe("/onboarding/applicability");
  });
});
