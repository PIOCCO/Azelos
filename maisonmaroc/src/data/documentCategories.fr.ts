/** French labels for APIO document categories (Documents page). */
export const DOCUMENT_CATEGORY_ORDER = [
  "institutionnel",
  "membres",
  "professionnel",
  "administratif",
  "juridique",
] as const;

export type DocumentCategoryId = (typeof DOCUMENT_CATEGORY_ORDER)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategoryId, string> = {
  institutionnel: "Documents institutionnels",
  membres: "Documents des membres",
  professionnel: "Documents professionnels",
  administratif: "Documents administratifs",
  juridique: "Documents juridiques et réglementaires",
};
