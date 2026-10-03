import type { TranslationDict } from "./types";

export function getNested(dict: TranslationDict, key: string): string | undefined {
  const parts = key.split(".");
  let cur: string | TranslationDict | undefined = dict;
  for (const part of parts) {
    if (cur === undefined || typeof cur === "string") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{{${name}}}`,
  );
}

export function createTranslator(dict: TranslationDict) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    const found = getNested(dict, key);
    if (found === undefined) return key;
    return interpolate(found, vars);
  };
}

export function statusTranslationKey(raw: string): string | null {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    critical: "status.critical",
    important: "status.important",
    neither: "status.neither",
    high: "status.high",
    medium: "status.medium",
    low: "status.low",
    open: "status.open",
    closed: "status.closed",
    active: "status.active",
    inactive: "status.inactive",
    implemented: "status.implemented",
    partial: "status.partial",
    not_started: "status.notStarted",
    in_progress: "status.inProgress",
    compliant: "status.compliant",
    non_compliant: "status.nonCompliant",
    not_applicable: "status.notApplicable",
  };
  return map[v] ?? null;
}
