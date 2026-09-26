import fs from "node:fs";
import {
  addProjectImage,
  createOwnerProject,
  deleteOwnerProject,
  deleteProjectImage,
  getOwnerDashboard,
  getOwnerProfileBundle,
  getOwnerProject,
  getProjectImageForDownload,
  listOwnerActivity,
  listOwnerContactRequests,
  listOwnerProjects,
  patchOwnerMe,
  patchOwnerProfile,
  removeOwnerProfileAvatar,
  reorderProjectImages,
  updateOwnerProject,
  uploadOwnerProfileAvatar,
} from "./ownerPortal.js";
import { sanitizeUser } from "./auth.js";
import { listMemberDocuments, getMemberDocumentForDownload, publicDownloadFilename, contentDispositionAttachment } from "./content.js";
import {
  deleteStoredFile,
  projectImageUploadMiddleware,
  persistValidatedProjectImage,
  resolveStoredFile,
} from "./uploads.js";
import { validateDocumentId } from "./validateIds.js";
import { validateUuid } from "./validateIds.js";
import { handleAuthError } from "./middleware.js";
import { logSecurityEvent } from "./securityLog.js";

export function registerOwnerRoutes(app, db, { requireAuth, requireOwner, uploadLimiter, ownerMutationLimiter }) {
  app.get("/api/owner/dashboard", requireAuth, requireOwner, (req, res) => {
    try {
      res.json(getOwnerDashboard(db, req.user));
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/owner/profile", requireAuth, requireOwner, (req, res) => {
    try {
      res.json(getOwnerProfileBundle(db, req.user));
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.patch("/api/owner/profile", requireAuth, requireOwner, ownerMutationLimiter, (req, res) => {
    try {
      const bundle = patchOwnerProfile(db, req.user, req.body || {});
      res.json(bundle);
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.post(
    "/api/owner/profile/avatar",
    requireAuth,
    requireOwner,
    uploadLimiter,
    (req, res) => {
      projectImageUploadMiddleware(req, res, (err) => {
        if (err) {
          return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: err.message || "Upload failed" });
        }
        if (!req.file) return res.status(400).json({ error: "File is required" });
        try {
          const stored = persistValidatedProjectImage(req.file.buffer);
          const { oldStorage, bundle } = uploadOwnerProfileAvatar(db, req.user, stored);
          if (oldStorage) deleteStoredFile(oldStorage);
          res.status(201).json(bundle);
        } catch (e) {
          handleAuthError(e, res);
        }
      });
    },
  );

  app.delete("/api/owner/profile/avatar", requireAuth, requireOwner, ownerMutationLimiter, (req, res) => {
    try {
      const { oldStorage, bundle } = removeOwnerProfileAvatar(db, req.user);
      if (oldStorage) deleteStoredFile(oldStorage);
      res.json(bundle);
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.patch("/api/owner/me", requireAuth, requireOwner, ownerMutationLimiter, (req, res) => {
    try {
      const row = patchOwnerMe(db, req.user, req.body || {});
      res.json({ user: sanitizeUser(row) });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/owner/documents", requireAuth, requireOwner, (req, res) => {
    res.json({ documents: listMemberDocuments(db) });
  });

  app.get("/api/owner/documents/:id/file", requireAuth, requireOwner, (req, res) => {
    const idCheck = validateDocumentId(req.params.id);
    if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
    const doc = getMemberDocumentForDownload(db, idCheck.value);
    if (!doc || !doc.file_storage) return res.status(404).json({ error: "Not found" });
    const mime = String(doc.file_mime || "").toLowerCase();
    if (!mime.includes("pdf")) return res.status(404).json({ error: "Not found" });
    const abs = resolveStoredFile(doc.file_storage);
    if (!abs) return res.status(404).json({ error: "Not found" });
    const filename = publicDownloadFilename(doc.title_fr, doc.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", contentDispositionAttachment(filename));
    logSecurityEvent("member_document_download", { userId: req.user.id, documentId: doc.id });
    fs.createReadStream(abs).pipe(res);
  });

  app.get("/api/owner/projects", requireAuth, requireOwner, (req, res) => {
    try {
      const q = String(req.query.q || "").slice(0, 100);
      const status = String(req.query.status || "").slice(0, 20);
      res.json(listOwnerProjects(db, req.user, { q, status }));
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.post("/api/owner/projects", requireAuth, requireOwner, ownerMutationLimiter, (req, res) => {
    try {
      res.status(201).json(createOwnerProject(db, req.user, req.body || {}));
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/owner/projects/:id", requireAuth, requireOwner, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      res.json(getOwnerProject(db, req.user, idCheck.value));
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.patch("/api/owner/projects/:id", requireAuth, requireOwner, ownerMutationLimiter, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      res.json(updateOwnerProject(db, req.user, idCheck.value, req.body || {}));
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.delete("/api/owner/projects/:id", requireAuth, requireOwner, ownerMutationLimiter, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      deleteOwnerProject(db, req.user, idCheck.value);
      res.json({ ok: true });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.post(
    "/api/owner/projects/:id/images",
    requireAuth,
    requireOwner,
    uploadLimiter,
    (req, res) => {
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      projectImageUploadMiddleware(req, res, (err) => {
        if (err) {
          return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: err.message || "Upload failed" });
        }
        if (!req.file) return res.status(400).json({ error: "File is required" });
        try {
          const stored = persistValidatedProjectImage(req.file.buffer);
          const images = addProjectImage(db, req.user, idCheck.value, stored);
          res.status(201).json({ images });
        } catch (e) {
          handleAuthError(e, res);
        }
      });
    },
  );

  app.patch("/api/owner/projects/:id/images", requireAuth, requireOwner, ownerMutationLimiter, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      const images = reorderProjectImages(db, req.user, idCheck.value, req.body || {});
      res.json({ images });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.delete("/api/owner/project-images/:imageId", requireAuth, requireOwner, ownerMutationLimiter, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.imageId);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      const storageName = deleteProjectImage(db, req.user, idCheck.value);
      deleteStoredFile(storageName);
      res.json({ ok: true });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/owner/project-images/:imageId/file", requireAuth, requireOwner, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.imageId);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      const file = getProjectImageForDownload(db, req.user, idCheck.value);
      const abs = resolveStoredFile(file.storageName);
      if (!abs) return res.status(404).json({ error: "Not found" });
      res.setHeader("Content-Type", file.mime);
      res.setHeader("X-Content-Type-Options", "nosniff");
      fs.createReadStream(abs).pipe(res);
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/owner/activity", requireAuth, requireOwner, (req, res) => {
    try {
      res.json({ activity: listOwnerActivity(db, req.user) });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/owner/requests", requireAuth, requireOwner, (req, res) => {
    try {
      res.json({ requests: listOwnerContactRequests(db, req.user) });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/owner/membership", requireAuth, requireOwner, (req, res) => {
    try {
      const bundle = getOwnerProfileBundle(db, req.user);
      res.json({
        status: req.user.status === "ACTIVE" ? "Actif" : "Suspendu",
        statusKey: req.user.status,
        memberSince: bundle.seedLocked.memberSince,
        verified: bundle.seedLocked.verified,
        ownerProfileId: req.user.ownerProfileId,
        agency: bundle.publicProfile.agency,
      });
    } catch (err) {
      handleAuthError(err, res);
    }
  });
}
