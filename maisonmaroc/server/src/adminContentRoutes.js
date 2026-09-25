import {
  adminArchiveNews,
  adminDeleteDocument,
  adminDeleteEvent,
  adminDeleteNews,
  adminGetDocument,
  adminGetEvent,
  adminGetNews,
  adminListDocuments,
  adminListEvents,
  adminListNews,
  adminSetDocumentFile,
  adminUpsertDocument,
  adminUpsertEvent,
  adminUpsertNews,
} from "./content.js";
import { validateDocumentPayload, validateEventPayload, validateNewsPayload } from "./validateContent.js";
import { documentUploadMiddleware, persistValidatedUpload } from "./uploads.js";

function sendContentError(err, res) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? "Internal server error" : err.message });
}

export function registerAdminContentRoutes(app, db, { requireAuth, requireSuperAdmin, adminMutationLimiter, uploadLimiter }) {
  app.get("/api/admin/news", requireAuth, requireSuperAdmin, (_req, res) => {
    res.json({ articles: adminListNews(db) });
  });

  app.get("/api/admin/news/:id", requireAuth, requireSuperAdmin, (req, res) => {
    const article = adminGetNews(db, req.params.id);
    if (!article) return res.status(404).json({ error: "Not found" });
    res.json({ article });
  });

  app.post("/api/admin/news", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    const validated = validateNewsPayload(req.body || {});
    if (!validated.ok) return res.status(400).json({ error: "Validation failed", details: validated.errors });
    try {
      const id = adminUpsertNews(db, { ...validated.data, id: null });
      res.status(201).json({ id, article: adminGetNews(db, id) });
    } catch (err) {
      sendContentError(err, res);
    }
  });

  app.patch("/api/admin/news/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    const validated = validateNewsPayload(req.body || {}, { partial: true });
    if (!validated.ok) return res.status(400).json({ error: "Validation failed", details: validated.errors });
    const existing = adminGetNews(db, req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const merged = {
      id: req.params.id,
      slug: validated.data.slug ?? existing.slug,
      titleFr: validated.data.titleFr ?? existing.titleFr,
      titleAr: validated.data.titleAr ?? existing.titleAr,
      summaryFr: validated.data.summaryFr ?? existing.summaryFr,
      summaryAr: validated.data.summaryAr ?? existing.summaryAr,
      bodyFr: validated.data.bodyFr ?? existing.bodyFr,
      bodyAr: validated.data.bodyAr ?? existing.bodyAr,
      imageUrl: validated.data.imageUrl !== undefined ? validated.data.imageUrl : existing.imageUrl,
      author: validated.data.author !== undefined ? validated.data.author : existing.author,
      published: validated.data.published !== undefined ? validated.data.published : existing.published,
      publishedAt: validated.data.publishedAt !== undefined ? validated.data.publishedAt : existing.publishedAt,
      archived: validated.data.archived !== undefined ? validated.data.archived : existing.archived,
    };
    try {
      adminUpsertNews(db, merged);
      res.json({ article: adminGetNews(db, req.params.id) });
    } catch (err) {
      sendContentError(err, res);
    }
  });

  app.post("/api/admin/news/:id/archive", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    if (!adminArchiveNews(db, req.params.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.delete("/api/admin/news/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    if (!adminDeleteNews(db, req.params.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.get("/api/admin/events", requireAuth, requireSuperAdmin, (_req, res) => {
    res.json({ events: adminListEvents(db) });
  });

  app.get("/api/admin/events/:id", requireAuth, requireSuperAdmin, (req, res) => {
    const event = adminGetEvent(db, req.params.id);
    if (!event) return res.status(404).json({ error: "Not found" });
    res.json({ event });
  });

  app.post("/api/admin/events", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    const validated = validateEventPayload(req.body || {});
    if (!validated.ok) return res.status(400).json({ error: "Validation failed", details: validated.errors });
    try {
      const id = adminUpsertEvent(db, { ...validated.data, id: null });
      res.status(201).json({ id, event: adminGetEvent(db, id) });
    } catch (err) {
      sendContentError(err, res);
    }
  });

  app.patch("/api/admin/events/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    const validated = validateEventPayload(req.body || {}, { partial: true });
    if (!validated.ok) return res.status(400).json({ error: "Validation failed", details: validated.errors });
    const existing = adminGetEvent(db, req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const merged = { ...existing, ...validated.data, id: req.params.id };
    try {
      adminUpsertEvent(db, merged);
      res.json({ event: adminGetEvent(db, req.params.id) });
    } catch (err) {
      sendContentError(err, res);
    }
  });

  app.delete("/api/admin/events/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    if (!adminDeleteEvent(db, req.params.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.get("/api/admin/documents", requireAuth, requireSuperAdmin, (_req, res) => {
    res.json({ documents: adminListDocuments(db) });
  });

  app.get("/api/admin/documents/:id", requireAuth, requireSuperAdmin, (req, res) => {
    const doc = adminGetDocument(db, req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ document: doc });
  });

  app.post("/api/admin/documents", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    const validated = validateDocumentPayload(req.body || {});
    if (!validated.ok) return res.status(400).json({ error: "Validation failed", details: validated.errors });
    try {
      const id = adminUpsertDocument(db, {
        ...validated.data,
        id: null,
        visibility: validated.data.visibility || "public",
      });
      res.status(201).json({ id, document: adminGetDocument(db, id) });
    } catch (err) {
      sendContentError(err, res);
    }
  });

  app.patch("/api/admin/documents/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    const validated = validateDocumentPayload(req.body || {}, { partial: true });
    if (!validated.ok) return res.status(400).json({ error: "Validation failed", details: validated.errors });
    const existing = adminGetDocument(db, req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const merged = {
      id: req.params.id,
      category: validated.data.category ?? existing.category,
      titleFr: validated.data.titleFr ?? existing.titleFr,
      titleAr: validated.data.titleAr ?? existing.titleAr,
      descriptionFr: validated.data.descriptionFr ?? existing.descriptionFr,
      descriptionAr: validated.data.descriptionAr ?? existing.descriptionAr,
      visibility: validated.data.visibility ?? existing.visibility,
      published: validated.data.published !== undefined ? validated.data.published : existing.published,
      publishedAt: validated.data.publishedAt !== undefined ? validated.data.publishedAt : existing.publishedAt,
    };
    try {
      adminUpsertDocument(db, merged);
      res.json({ document: adminGetDocument(db, req.params.id) });
    } catch (err) {
      sendContentError(err, res);
    }
  });

  app.post(
    "/api/admin/documents/:id/upload",
    requireAuth,
    requireSuperAdmin,
    uploadLimiter,
    (req, res) => {
      documentUploadMiddleware(req, res, (err) => {
        if (err) {
          const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
          return res.status(status).json({ error: err.message || "Upload failed" });
        }
        if (!req.file) return res.status(400).json({ error: "File is required" });
        const doc = adminGetDocument(db, req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        try {
          const stored = persistValidatedUpload(req.file.buffer, req.file.mimetype);
          adminSetDocumentFile(db, req.params.id, stored);
          res.json({ document: adminGetDocument(db, req.params.id) });
        } catch (e) {
          sendContentError(e, res);
        }
      });
    },
  );

  app.delete("/api/admin/documents/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    if (!adminDeleteDocument(db, req.params.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });
}
