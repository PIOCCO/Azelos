import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";

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
  };
}

function rowToDocument(r) {
  return {
    id: r.id,
    category: r.category,
    title: { fr: r.title_fr, ar: r.title_ar },
    description: { fr: r.description_fr || "", ar: r.description_ar || "" },
    fileUrl: r.file_url || null,
    publishedAt: r.published_at,
  };
}

export function listPublishedNews(db, { limit = 50, offset = 0 } = {}) {
  const rows = db
    .prepare(
      `SELECT * FROM news_posts WHERE published = 1 ORDER BY published_at DESC LIMIT ? OFFSET ?`,
    )
    .all(limit, offset);
  return rows.map(rowToNews);
}

export function getNewsBySlug(db, slug) {
  const r = db
    .prepare(`SELECT * FROM news_posts WHERE slug = ? AND published = 1`)
    .get(slug);
  return r ? rowToNews(r) : null;
}

export function listPublishedEvents(db, { upcomingOnly = false } = {}) {
  const now = new Date().toISOString();
  const sql = upcomingOnly
    ? `SELECT * FROM events WHERE published = 1 AND starts_at >= ? ORDER BY starts_at ASC`
    : `SELECT * FROM events WHERE published = 1 ORDER BY starts_at DESC`;
  const rows = upcomingOnly
    ? db.prepare(sql).all(now)
    : db.prepare(sql).all();
  return rows.map(rowToEvent);
}

export function listPublicDocuments(db) {
  const rows = db
    .prepare(
      `SELECT * FROM documents WHERE published = 1 AND visibility = 'public' ORDER BY published_at DESC`,
    )
    .all();
  return rows.map(rowToDocument);
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

/** Admin */
export function adminListNews(db) {
  return db.prepare(`SELECT * FROM news_posts ORDER BY updated_at DESC`).all();
}

export function adminUpsertNews(db, data) {
  const now = new Date().toISOString();
  if (data.id) {
    db.prepare(
      `UPDATE news_posts SET slug=?, title_fr=?, title_ar=?, summary_fr=?, summary_ar=?, body_fr=?, body_ar=?,
       image_url=?, author=?, published=?, published_at=?, updated_at=? WHERE id=?`,
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
      now,
      data.id,
    );
    return data.id;
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO news_posts (id, slug, title_fr, title_ar, summary_fr, summary_ar, body_fr, body_ar, image_url, author, published, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    now,
    now,
  );
  return id;
}

export function seedDemoContent(db) {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM news_posts`).get().c;
  if (count > 0) return;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO news_posts (id, slug, title_fr, title_ar, summary_fr, summary_ar, body_fr, body_ar, published, published_at, created_at, updated_at, author)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
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
