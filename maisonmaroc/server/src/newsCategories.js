/** Allowlisted news categories (public filter + admin). */
export const NEWS_CATEGORY_IDS = [
  "association",
  "immobilier",
  "evenements",
  "reglementation",
  "communiques",
  "partenariats",
];

const SET = new Set(NEWS_CATEGORY_IDS);

export function normalizeNewsCategory(raw) {
  const id = String(raw ?? "association").trim().toLowerCase();
  if (!SET.has(id)) return null;
  return id;
}

export function validateNewsCategory(raw, { required = true } = {}) {
  if (raw === undefined || raw === null || raw === "") {
    return required ? { ok: false, error: "Invalid category" } : { ok: true, value: "association" };
  }
  const v = normalizeNewsCategory(raw);
  if (!v) return { ok: false, error: "Invalid category" };
  return { ok: true, value: v };
}

export function newsCategoriesForApi() {
  return NEWS_CATEGORY_IDS.map((id) => ({ id }));
}
