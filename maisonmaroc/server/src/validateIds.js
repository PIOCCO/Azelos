const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DOCUMENT_ID_RE = /^[a-z0-9][a-z0-9-]{0,126}$/i;

export function validateUuid(id) {
  const s = String(id ?? "").trim();
  if (!UUID_RE.test(s)) return { ok: false };
  return { ok: true, value: s };
}

/** Catalog / admin document primary keys (e.g. doc-presentation-apio). */
export function validateDocumentId(id) {
  const s = String(id ?? "").trim();
  if (s.length < 2 || s.length > 128 || !DOCUMENT_ID_RE.test(s)) return { ok: false };
  return { ok: true, value: s };
}
