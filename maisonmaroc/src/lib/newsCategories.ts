export const NEWS_CATEGORY_IDS = [
  "association",
  "immobilier",
  "evenements",
  "reglementation",
  "communiques",
  "partenariats",
] as const;

export type NewsCategoryId = (typeof NEWS_CATEGORY_IDS)[number];

const LABELS_FR: Record<NewsCategoryId, string> = {
  association: "Association",
  immobilier: "Immobilier",
  evenements: "Événements",
  reglementation: "Réglementation",
  communiques: "Communiqués",
  partenariats: "Partenariats",
};

const LABELS_AR: Record<NewsCategoryId, string> = {
  association: "الجمعية",
  immobilier: "العقار",
  evenements: "الفعاليات",
  reglementation: "التنظيم",
  communiques: "بلاغات",
  partenariats: "شراكات",
};

export function newsCategoryLabel(id: string | null | undefined, lang: "fr" | "ar"): string {
  const key = (id || "association") as NewsCategoryId;
  if (lang === "ar") return LABELS_AR[key] ?? id ?? "Actualité";
  return LABELS_FR[key] ?? id ?? "Actualité";
}

export function isNewsCategoryId(id: string): id is NewsCategoryId {
  return (NEWS_CATEGORY_IDS as readonly string[]).includes(id);
}
