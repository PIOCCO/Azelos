import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import {
  APIO_DOCUMENT_CATALOG,
  APIO_DOCUMENT_TEMPLATES,
  DOCUMENT_CATEGORY_ORDER,
} from "./apioDocumentCatalog.js";
import { deleteStoredFile, UPLOAD_DIR } from "./uploads.js";

function rowToNews(r) {
  return {
    id: r.id,
    slug: r.slug,
    title: { fr: r.title_fr, ar: r.title_ar },
    summary: { fr: r.summary_fr || "", ar: r.summary_ar || "" },
    body: { fr: r.body_fr, ar: r.body_ar },
    imageUrl: r.image_url || null,
    author: r.author || null,
    publishedAt: r.published_at,
  };
}

function rowToEvent(r) {
  return {
    id: r.id,
    slug: r.slug,
    title: { fr: r.title_fr, ar: r.title_ar },
    description: { fr: r.description_fr || "", ar: r.description_ar || "" },
    location: { fr: r.location_fr || "", ar: r.location_ar || "" },
    startsAt: r.starts_at,
    endsAt: r.ends_at || null,
    organizer: r.organizer || null,
    contactInfo: r.contact_info || null,
    imageUrl: r.image_url || null,
  };
}

function rowToDocument(r, { includeInternal = false } = {}) {
  const base = {
    id: r.id,
    category: r.category,
    title: { fr: r.title_fr, ar: r.title_ar },
    description: { fr: r.description_fr || "", ar: r.description_ar || "" },
    fileUrl: r.file_storage ? `/api/content/documents/${r.id}/file` : r.file_url || null,
    publishedAt: r.published_at,
    availability: r.doc_availability || "coming_soon",
    fileFormat: r.file_format || "PDF",
    viewUrl: r.view_url || null,
    fileMime: r.file_mime || null,
  };
  if (includeInternal) {
    return {
      ...base,
      visibility: r.visibility,
      published: Boolean(r.published),
      fileStorage: r.file_storage || null,
      fileMime: r.file_mime || null,
      fileSize: r.file_size ?? null,
    };
  }
  return base;
}

function rowToAdminNews(r) {
  return {
    id: r.id,
    slug: r.slug,
    titleFr: r.title_fr,
    titleAr: r.title_ar,
    summaryFr: r.summary_fr || "",
    summaryAr: r.summary_ar || "",
    bodyFr: r.body_fr,
    bodyAr: r.body_ar,
    imageUrl: r.image_url || null,
    author: r.author || null,
    published: Boolean(r.published),
    archived: Boolean(r.archived),
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToAdminEvent(r) {
  return {
    id: r.id,
    slug: r.slug,
    titleFr: r.title_fr,
    titleAr: r.title_ar,
    descriptionFr: r.description_fr || "",
    descriptionAr: r.description_ar || "",
    locationFr: r.location_fr || "",
    locationAr: r.location_ar || "",
    startsAt: r.starts_at,
    endsAt: r.ends_at || null,
    organizer: r.organizer || null,
    contactInfo: r.contact_info || null,
    imageUrl: r.image_url || null,
    published: Boolean(r.published),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToAdminDocument(r) {
  return rowToDocument(r, { includeInternal: true });
}

export function listPublishedNews(db, { limit = 50, offset = 0 } = {}) {
  const rows = db
    .prepare(
      `SELECT * FROM news_posts WHERE published = 1 AND archived = 0 ORDER BY published_at DESC LIMIT ? OFFSET ?`,
    )
    .all(limit, offset);
  return rows.map(rowToNews);
}

export function getNewsBySlug(db, slug) {
  const r = db
    .prepare(`SELECT * FROM news_posts WHERE slug = ? AND published = 1 AND archived = 0`)
    .get(slug);
  return r ? rowToNews(r) : null;
}

export function listPublishedEvents(db, { upcomingOnly = false } = {}) {
  const now = new Date().toISOString();
  const sql = upcomingOnly
    ? `SELECT * FROM events WHERE published = 1 AND starts_at >= ? ORDER BY starts_at ASC`
    : `SELECT * FROM events WHERE published = 1 ORDER BY starts_at DESC`;
  const rows = upcomingOnly ? db.prepare(sql).all(now) : db.prepare(sql).all();
  return rows.map(rowToEvent);
}

export function listPublicDocuments(db) {
  const rows = db
    .prepare(`SELECT * FROM documents WHERE published = 1 AND visibility = 'public'`)
    .all();
  const orderIdx = (cat) => {
    const i = DOCUMENT_CATEGORY_ORDER.indexOf(cat);
    return i === -1 ? 999 : i;
  };
  rows.sort((a, b) => {
    const c = orderIdx(a.category) - orderIdx(b.category);
    if (c !== 0) return c;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  return rows.map((r) => rowToDocument(r));
}

export function getPublicDocumentFile(db, id) {
  const r = db
    .prepare(
      `SELECT * FROM documents WHERE id = ? AND published = 1 AND visibility = 'public'`,
    )
    .get(id);
  return r || null;
}

/** Safe attachment filename for public PDF downloads (no path segments). */
export function publicDownloadFilename(titleFr, docId) {
  const base = String(titleFr || docId)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const stem = base || String(docId).replace(/[^a-z0-9-]+/gi, "-").slice(0, 40);
  return `${stem}.pdf`;
}

export function contentDispositionAttachment(filename) {
  const ascii = String(filename).replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export function createContactSubmission(db, payload, ip) {
  const id = randomUUID();
  const ipHash = ip
    ? createHash("sha256").update(String(ip)).digest("hex").slice(0, 16)
    : null;
  db.prepare(
    `INSERT INTO contact_submissions (id, first_name, last_name, email, phone, subject, message, ip_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  ).run(
    id,
    payload.firstName,
    payload.lastName,
    payload.email,
    payload.phone || null,
    payload.subject,
    payload.message,
    ipHash,
  );
  return id;
}

export function findNewsSlugConflict(db, slug, excludeId = null) {
  const row = excludeId
    ? db.prepare(`SELECT id FROM news_posts WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM news_posts WHERE slug = ?`).get(slug);
  return Boolean(row);
}

export function adminListNews(db) {
  return db
    .prepare(`SELECT * FROM news_posts ORDER BY updated_at DESC`)
    .all()
    .map(rowToAdminNews);
}

export function adminGetNews(db, id) {
  const r = db.prepare(`SELECT * FROM news_posts WHERE id = ?`).get(id);
  return r ? rowToAdminNews(r) : null;
}

export function adminUpsertNews(db, data) {
  const now = new Date().toISOString();
  if (findNewsSlugConflict(db, data.slug, data.id || null)) {
    const err = new Error("Slug already in use");
    err.status = 409;
    throw err;
  }
  if (data.id) {
    const existing = db.prepare(`SELECT id FROM news_posts WHERE id = ?`).get(data.id);
    if (!existing) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }
    db.prepare(
      `UPDATE news_posts SET slug=?, title_fr=?, title_ar=?, summary_fr=?, summary_ar=?, body_fr=?, body_ar=?,
       image_url=?, author=?, published=?, published_at=?, archived=?, updated_at=? WHERE id=?`,
    ).run(
      data.slug,
      data.titleFr,
      data.titleAr,
      data.summaryFr || "",
      data.summaryAr || "",
      data.bodyFr,
      data.bodyAr,
      data.imageUrl || null,
      data.author || null,
      data.published ? 1 : 0,
      data.published ? data.publishedAt || now : null,
      data.archived ? 1 : 0,
      now,
      data.id,
    );
    return data.id;
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO news_posts (id, slug, title_fr, title_ar, summary_fr, summary_ar, body_fr, body_ar, image_url, author, published, published_at, archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.slug,
    data.titleFr,
    data.titleAr,
    data.summaryFr || "",
    data.summaryAr || "",
    data.bodyFr,
    data.bodyAr,
    data.imageUrl || null,
    data.author || null,
    data.published ? 1 : 0,
    data.published ? data.publishedAt || now : null,
    data.archived ? 1 : 0,
    now,
    now,
  );
  return id;
}

export function adminArchiveNews(db, id) {
  const r = db.prepare(`SELECT id FROM news_posts WHERE id = ?`).get(id);
  if (!r) return false;
  db.prepare(
    `UPDATE news_posts SET archived = 1, published = 0, updated_at = ? WHERE id = ?`,
  ).run(new Date().toISOString(), id);
  return true;
}

export function adminDeleteNews(db, id) {
  const r = db.prepare(`SELECT id FROM news_posts WHERE id = ?`).get(id);
  if (!r) return false;
  db.prepare(`DELETE FROM news_posts WHERE id = ?`).run(id);
  return true;
}

export function adminListEvents(db) {
  return db.prepare(`SELECT * FROM events ORDER BY starts_at DESC`).all().map(rowToAdminEvent);
}

export function adminGetEvent(db, id) {
  const r = db.prepare(`SELECT * FROM events WHERE id = ?`).get(id);
  return r ? rowToAdminEvent(r) : null;
}

export function adminUpsertEvent(db, data) {
  const now = new Date().toISOString();
  if (data.id) {
    const existing = db.prepare(`SELECT id FROM events WHERE id = ?`).get(data.id);
    if (!existing) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }
    db.prepare(
      `UPDATE events SET slug=?, title_fr=?, title_ar=?, description_fr=?, description_ar=?, location_fr=?, location_ar=?,
       starts_at=?, ends_at=?, organizer=?, contact_info=?, image_url=?, published=?, updated_at=? WHERE id=?`,
    ).run(
      data.slug,
      data.titleFr,
      data.titleAr,
      data.descriptionFr || "",
      data.descriptionAr || "",
      data.locationFr || "",
      data.locationAr || "",
      data.startsAt,
      data.endsAt || null,
      data.organizer || null,
      data.contactInfo || null,
      data.imageUrl || null,
      data.published ? 1 : 0,
      now,
      data.id,
    );
    return data.id;
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO events (id, slug, title_fr, title_ar, description_fr, description_ar, location_fr, location_ar, starts_at, ends_at, organizer, contact_info, image_url, published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.slug,
    data.titleFr,
    data.titleAr,
    data.descriptionFr || "",
    data.descriptionAr || "",
    data.locationFr || "",
    data.locationAr || "",
    data.startsAt,
    data.endsAt || null,
    data.organizer || null,
    data.contactInfo || null,
    data.imageUrl || null,
    data.published ? 1 : 0,
    now,
    now,
  );
  return id;
}

export function adminDeleteEvent(db, id) {
  const r = db.prepare(`SELECT id FROM events WHERE id = ?`).get(id);
  if (!r) return false;
  db.prepare(`DELETE FROM events WHERE id = ?`).run(id);
  return true;
}

export function adminListDocuments(db) {
  return db
    .prepare(`SELECT * FROM documents ORDER BY updated_at DESC`)
    .all()
    .map(rowToAdminDocument);
}

export function adminGetDocument(db, id) {
  const r = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  return r ? rowToAdminDocument(r) : null;
}

export function adminUpsertDocument(db, data) {
  const now = new Date().toISOString();
  if (data.id) {
    const existing = db.prepare(`SELECT id FROM documents WHERE id = ?`).get(data.id);
    if (!existing) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }
    db.prepare(
      `UPDATE documents SET category=?, title_fr=?, title_ar=?, description_fr=?, description_ar=?, visibility=?, published=?, published_at=?, updated_at=? WHERE id=?`,
    ).run(
      data.category,
      data.titleFr,
      data.titleAr,
      data.descriptionFr || "",
      data.descriptionAr || "",
      data.visibility,
      data.published ? 1 : 0,
      data.published ? data.publishedAt || now : null,
      now,
      data.id,
    );
    return data.id;
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO documents (id, category, title_fr, title_ar, description_fr, description_ar, visibility, published, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.category,
    data.titleFr,
    data.titleAr,
    data.descriptionFr || "",
    data.descriptionAr || "",
    data.visibility || "public",
    data.published ? 1 : 0,
    data.published ? data.publishedAt || now : null,
    now,
    now,
  );
  return id;
}

export function adminSetDocumentFile(db, id, { storageName, mime, size }) {
  const r = db.prepare(`SELECT file_storage FROM documents WHERE id = ?`).get(id);
  if (!r) return false;
  if (r.file_storage) deleteStoredFile(r.file_storage);
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE documents SET file_storage=?, file_mime=?, file_size=?, file_url=NULL, updated_at=? WHERE id=?`,
  ).run(storageName, mime, size, now, id);
  return true;
}

export function adminDeleteDocument(db, id) {
  const r = db.prepare(`SELECT file_storage FROM documents WHERE id = ?`).get(id);
  if (!r) return false;
  if (r.file_storage) deleteStoredFile(r.file_storage);
  db.prepare(`DELETE FROM documents WHERE id = ?`).run(id);
  return true;
}

function writeTemplateFile(docId, html) {
  const storageName = `apio-${docId}.html`;
  const abs = path.resolve(UPLOAD_DIR, storageName);
  if (!abs.startsWith(UPLOAD_DIR + path.sep)) throw new Error("Invalid template path");
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(abs, html, { encoding: "utf8", mode: 0o640 });
  return {
    storageName,
    mime: "text/html; charset=utf-8",
    size: Buffer.byteLength(html, "utf8"),
  };
}

export function seedApioDocuments(db) {
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO documents (
      id, category, title_fr, title_ar, description_fr, description_ar,
      visibility, published, published_at, created_at, updated_at,
      doc_availability, file_format, sort_order, view_url,
      file_storage, file_mime, file_size
    ) VALUES (?, ?, ?, ?, ?, ?, 'public', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const entry of APIO_DOCUMENT_CATALOG) {
    const exists = db.prepare(`SELECT id FROM documents WHERE id = ?`).get(entry.id);
    if (exists) continue;

    let file_storage = null;
    let file_mime = null;
    let file_size = null;
    if (entry.templateKey && APIO_DOCUMENT_TEMPLATES[entry.templateKey]) {
      const file = writeTemplateFile(entry.id, APIO_DOCUMENT_TEMPLATES[entry.templateKey]);
      file_storage = file.storageName;
      file_mime = file.mime;
      file_size = file.size;
    }

    const titleAr = entry.titleFr;
    insert.run(
      entry.id,
      entry.category,
      entry.titleFr,
      titleAr,
      entry.descriptionFr,
      entry.descriptionFr,
      now,
      now,
      now,
      entry.availability,
      entry.fileFormat,
      entry.sortOrder,
      entry.viewUrl || null,
      file_storage,
      file_mime,
      file_size,
    );
  }
}

export function seedDemoContent(db) {
  seedApioDocuments(db);
  const count = db.prepare(`SELECT COUNT(*) AS c FROM news_posts`).get().c;
  if (count > 0) return;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO news_posts (id, slug, title_fr, title_ar, summary_fr, summary_ar, body_fr, body_ar, published, published_at, created_at, updated_at, author, archived)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0)`,
  ).run(
    randomUUID(),
    "bienvenue-apio",
    "Bienvenue sur le site institutionnel APIO",
    "مرحبًا بكم في الموقع المؤسساتي لـ APIO",
    "Espace d'information de l'association — contenu éditorial à compléter.",
    "فضاء معلوماتي للجمعية — محتوى تحريري قابل للتحديث.",
    "Ce contenu est un exemple éditorial. Remplacez-le par les communiqués officiels validés par APIO.",
    "هذا محتوى توضيحي. يُرجى استبداله بالبلاغات الرسمية المعتمدة من APIO.",
    now,
    now,
    now,
    "APIO",
  );
}
