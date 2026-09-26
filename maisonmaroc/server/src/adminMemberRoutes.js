import {
  createMemberWithAccount,
  getMemberDetailForAdmin,
  listMembersForAdmin,
  patchMemberByAdmin,
} from "./adminMembers.js";
import { listMemberProjectsForAdmin, adminUpdateMemberProject, adminDeleteMemberProject } from "./adminProjects.js";
import { sanitizeUser } from "./auth.js";
import { handleAuthError } from "./middleware.js";
import { validateUuid } from "./validateIds.js";

export function registerAdminMemberRoutes(app, db, { requireAuth, requireSuperAdmin, adminMutationLimiter }) {
  app.get("/api/admin/members", requireAuth, requireSuperAdmin, (req, res) => {
    const q = String(req.query.q || "").slice(0, 100);
    const status = String(req.query.status || "").slice(0, 20);
    const sort = String(req.query.sort || "created_desc").slice(0, 32);
    res.json({ members: listMembersForAdmin(db, { q, status, sort }) });
  });

  app.post("/api/admin/members", requireAuth, requireSuperAdmin, adminMutationLimiter, async (req, res) => {
    try {
      const result = await createMemberWithAccount(db, req.user, req.body || {});
      res.status(201).json({
        member: sanitizeUser(result.user),
        ownerProfileId: result.ownerProfileId,
        profile: result.profile,
      });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/admin/members/:id", requireAuth, requireSuperAdmin, (req, res) => {
    const idCheck = validateUuid(req.params.id);
    if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
    const detail = getMemberDetailForAdmin(db, idCheck.value);
    if (!detail) return res.status(404).json({ error: "Not found" });
    res.json(detail);
  });

  app.patch("/api/admin/members/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      const detail = patchMemberByAdmin(db, req.user, idCheck.value, req.body || {});
      res.json(detail);
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/admin/member-projects", requireAuth, requireSuperAdmin, (req, res) => {
    const q = String(req.query.q || "").slice(0, 100);
    const ownerProfileId = String(req.query.ownerProfileId || "").slice(0, 128);
    const status = String(req.query.status || "").slice(0, 20);
    res.json({ projects: listMemberProjectsForAdmin(db, { q, ownerProfileId, status }) });
  });

  app.patch("/api/admin/member-projects/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      const project = adminUpdateMemberProject(db, req.user, idCheck.value, req.body || {});
      res.json({ project });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.delete("/api/admin/member-projects/:id", requireAuth, requireSuperAdmin, adminMutationLimiter, (req, res) => {
    try {
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      adminDeleteMemberProject(db, req.user, idCheck.value);
      res.json({ ok: true });
    } catch (err) {
      handleAuthError(err, res);
    }
  });
}
