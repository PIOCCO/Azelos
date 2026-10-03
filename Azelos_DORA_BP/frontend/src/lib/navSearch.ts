import type { Role } from "../api/types";
import en from "../i18n/translations/en";
import fr from "../i18n/translations/fr";
import { getNested } from "../i18n/translate";
import { NAV_SEARCH_REGISTRY, type NavSearchEntry } from "./navSearchRegistry";

export interface NavSearchHit {
  entry: NavSearchEntry;
  score: number;
  label: string;
}

function normalize(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function labelVariants(labelKey: string): string[] {
  const enLabel = getNested(en, labelKey);
  const frLabel = getNested(fr, labelKey);
  return [enLabel, frLabel].filter((x): x is string => !!x).map(normalize);
}

function scoreToken(query: string, token: string): number {
  const t = normalize(token);
  if (!t || !query) return 0;
  if (query === t) return 100;
  if (t.startsWith(query) || query.startsWith(t)) return 85;
  if (t.includes(query) || query.includes(t)) return 65;
  return 0;
}

function scoreEntry(query: string, entry: NavSearchEntry): number {
  let best = 0;
  for (const label of labelVariants(entry.labelKey)) {
    best = Math.max(best, scoreToken(query, label));
    for (const word of label.split(/\s+/)) {
      best = Math.max(best, scoreToken(query, word));
    }
  }
  for (const kw of [...entry.keywords.en, ...entry.keywords.fr]) {
    best = Math.max(best, scoreToken(query, kw));
  }
  return best;
}

export function filterNavSearchEntries(options: {
  isAdmin: boolean;
  role?: Role;
}): NavSearchEntry[] {
  return NAV_SEARCH_REGISTRY.filter((e) => {
    if (e.platformAdminOnly && options.role !== "SUPER_ADMIN") return false;
    if (e.adminOnly && !options.isAdmin) {
      if (e.route === "/settings/language") return true;
      return false;
    }
    return true;
  });
}

export function searchNavigation(
  rawQuery: string,
  options: {
    isAdmin: boolean;
    role?: Role;
    /** Translator for display label in active locale */
    t: (key: string) => string;
    minScore?: number;
    limit?: number;
  },
): NavSearchHit[] {
  const query = normalize(rawQuery);
  if (query.length < 1) return [];

  const minScore = options.minScore ?? (query.length === 1 ? 100 : 55);
  const limit = options.limit ?? 12;

  const hits: NavSearchHit[] = [];
  for (const entry of filterNavSearchEntries(options)) {
    const score = scoreEntry(query, entry);
    if (score >= minScore) {
      hits.push({
        entry,
        score,
        label: options.t(entry.labelKey),
      });
    }
  }

  hits.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  return hits.slice(0, limit);
}

export function bestNavigationMatch(
  rawQuery: string,
  options: Parameters<typeof searchNavigation>[1],
): NavSearchHit | undefined {
  return searchNavigation(rawQuery, { ...options, limit: 1 })[0];
}
