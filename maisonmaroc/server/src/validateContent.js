const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSlug(slug) {
  const s = String(slug || "").trim().toLowerCase();
  if (s.length < 2 || s.length > 120 || !SLUG_RE.test(s)) {
    return { ok: false, error: "Invalid slug" };
  }
  return { ok: true, value: s };
}

export function validateNewsPayload(body, { partial = false } = {}) {
  const errors = [];
  const out = {};

  if (!partial || body.slug !== undefined) {
    const slug = validateSlug(body.slug);
    if (!slug.ok) errors.push(slug.error);
    else out.slug = slug.value;
  }
  if (!partial || body.titleFr !== undefined) {
    out.titleFr = String(body.titleFr ?? "").trim();
    if (!out.titleFr || out.titleFr.length > 500) errors.push("Invalid titleFr");
  }
  if (!partial || body.titleAr !== undefined) {
    out.titleAr = String(body.titleAr ?? "").trim();
    if (!out.titleAr || out.titleAr.length > 500) errors.push("Invalid titleAr");
  }
  if (body.summaryFr !== undefined) out.summaryFr = String(body.summaryFr).slice(0, 1000);
  if (body.summaryAr !== undefined) out.summaryAr = String(body.summaryAr).slice(0, 1000);
  if (!partial || body.bodyFr !== undefined) {
    out.bodyFr = String(body.bodyFr ?? "");
    if (!out.bodyFr.trim() || out.bodyFr.length > 50000) errors.push("Invalid bodyFr");
  }
  if (!partial || body.bodyAr !== undefined) {
    out.bodyAr = String(body.bodyAr ?? "");
    if (!out.bodyAr.trim() || out.bodyAr.length > 50000) errors.push("Invalid bodyAr");
  }
  if (body.imageUrl !== undefined) {
    const url = body.imageUrl ? String(body.imageUrl).trim() : "";
    if (url && url.length > 2000) errors.push("Invalid imageUrl");
    else out.imageUrl = url || null;
  }
  if (body.author !== undefined) {
    out.author = body.author ? String(body.author).slice(0, 200) : null;
  }
  if (body.published !== undefined) out.published = Boolean(body.published);
  if (body.publishedAt !== undefined) {
    out.publishedAt = body.publishedAt ? String(body.publishedAt) : null;
  }
  if (body.archived !== undefined) out.archived = Boolean(body.archived);

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: out };
}

export function validateEventPayload(body, { partial = false } = {}) {
  const errors = [];
  const out = {};

  if (body.slug !== undefined && body.slug) {
    const slug = validateSlug(body.slug);
    if (!slug.ok) errors.push(slug.error);
    else out.slug = slug.value;
  } else if (!partial) {
    out.slug = null;
  }

  if (!partial || body.titleFr !== undefined) {
    out.titleFr = String(body.titleFr ?? "").trim();
    if (!out.titleFr || out.titleFr.length > 500) errors.push("Invalid titleFr");
  }
  if (!partial || body.titleAr !== undefined) {
    out.titleAr = String(body.titleAr ?? "").trim();
    if (!out.titleAr || out.titleAr.length > 500) errors.push("Invalid titleAr");
  }
  if (body.descriptionFr !== undefined) out.descriptionFr = String(body.descriptionFr).slice(0, 10000);
  if (body.descriptionAr !== undefined) out.descriptionAr = String(body.descriptionAr).slice(0, 10000);
  if (body.locationFr !== undefined) out.locationFr = String(body.locationFr).slice(0, 500);
  if (body.locationAr !== undefined) out.locationAr = String(body.locationAr).slice(0, 500);
  if (!partial || body.startsAt !== undefined) {
    out.startsAt = String(body.startsAt ?? "").trim();
    if (!out.startsAt || Number.isNaN(Date.parse(out.startsAt))) errors.push("Invalid startsAt");
  }
  if (body.endsAt !== undefined) {
    const v = body.endsAt ? String(body.endsAt).trim() : "";
    out.endsAt = v && !Number.isNaN(Date.parse(v)) ? v : null;
  }
  if (body.organizer !== undefined) out.organizer = body.organizer ? String(body.organizer).slice(0, 200) : null;
  if (body.contactInfo !== undefined) {
    out.contactInfo = body.contactInfo ? String(body.contactInfo).slice(0, 1000) : null;
  }
  if (body.imageUrl !== undefined) {
    const url = body.imageUrl ? String(body.imageUrl).trim() : "";
    out.imageUrl = url && url.length <= 2000 ? url : null;
  }
  if (body.published !== undefined) out.published = Boolean(body.published);

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: out };
}

const DOC_CATEGORIES = new Set([
  "publication",
  "report",
  "association",
  "sector",
  "announcement",
  "form",
  "press",
  "other",
]);

const VISIBILITY = new Set(["public", "members", "admin"]);

export function validateDocumentPayload(body, { partial = false } = {}) {
  const errors = [];
  const out = {};

  if (!partial || body.category !== undefined) {
    const cat = String(body.category ?? "").trim().toLowerCase();
    if (!DOC_CATEGORIES.has(cat)) errors.push("Invalid category");
    else out.category = cat;
  }
  if (!partial || body.titleFr !== undefined) {
    out.titleFr = String(body.titleFr ?? "").trim();
    if (!out.titleFr || out.titleFr.length > 500) errors.push("Invalid titleFr");
  }
  if (!partial || body.titleAr !== undefined) {
    out.titleAr = String(body.titleAr ?? "").trim();
    if (!out.titleAr || out.titleAr.length > 500) errors.push("Invalid titleAr");
  }
  if (body.descriptionFr !== undefined) out.descriptionFr = String(body.descriptionFr).slice(0, 5000);
  if (body.descriptionAr !== undefined) out.descriptionAr = String(body.descriptionAr).slice(0, 5000);
  if (body.visibility !== undefined) {
    const v = String(body.visibility).trim().toLowerCase();
    if (!VISIBILITY.has(v)) errors.push("Invalid visibility");
    else out.visibility = v;
  }
  if (body.published !== undefined) out.published = Boolean(body.published);
  if (body.publishedAt !== undefined) {
    out.publishedAt = body.publishedAt ? String(body.publishedAt) : null;
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: out };
}

export function clampPagination(query) {
  let limit = parseInt(String(query.limit ?? "50"), 10);
  let offset = parseInt(String(query.offset ?? "0"), 10);
  if (Number.isNaN(limit) || limit < 1) limit = 50;
  if (limit > 100) limit = 100;
  if (Number.isNaN(offset) || offset < 0) offset = 0;
  if (offset > 10_000) offset = 10_000;
  return { limit, offset };
}

export { EMAIL_RE };
