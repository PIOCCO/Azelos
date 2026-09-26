import { logAdminAction } from "./adminAudit.js";
import { ADMIN_PROJECT_PATCH_FIELDS, rejectForbiddenBodyFields } from "./securityFields.js";
import { rowToPublicProperty } from "./memberListings.js";
import { getMemberProfileById } from "./memberProfiles.js";

export function listMemberProjectsForAdmin(db, { q = "", ownerProfileId = "", status = "" } = {}) {
  let rows = db.prepare(`SELECT * FROM owner_project_drafts ORDER BY updated_at DESC`).all();
  if (ownerProfileId) rows = rows.filter((r) => r.owner_profile_id === ownerProfileId);
  if (status) rows = rows.filter((r) => r.status === status);
  if (q) {
    const qq = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title_fr.toLowerCase().includes(qq) ||
        r.title_ar.includes(q) ||
        (r.slug || "").toLowerCase().includes(qq) ||
        r.owner_profile_id.toLowerCase().includes(qq),
    );
  }
  return rows.map((r) => {
    const profile = getMemberProfileById(db, r.owner_profile_id);
    return {
      ...rowToPublicProperty(db, r),
      status: r.status,
      hidden: Boolean(r.hidden),
      ownerProfileId: r.owner_profile_id,
      ownerLabel: profile?.agency?.fr || profile?.name?.fr || r.owner_profile_id,
      updatedAt: r.updated_at,
    };
  });
}

export function adminUpdateMemberProject(db, adminUser, projectId, body) {
  const extra = Object.keys(body || {}).filter((k) => !ADMIN_PROJECT_PATCH_FIELDS.includes(k));
  rejectForbiddenBodyFields(body, extra, "Unexpected field in request");
  const row = db.prepare(`SELECT * FROM owner_project_drafts WHERE id = ?`).get(projectId);
  if (!row) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  const now = new Date().toISOString();
  const nextHidden = body.hidden !== undefined ? (body.hidden ? 1 : 0) : row.hidden;
  let nextStatus = body.status !== undefined ? String(body.status) : row.status;
  const allowed = new Set(["draft", "published", "archived", "pending", "rejected"]);
  if (!allowed.has(nextStatus)) {
    const err = new Error("Invalid status");
    err.status = 400;
    throw err;
  }
  db.prepare(`UPDATE owner_project_drafts SET hidden = ?, status = ?, updated_at = ? WHERE id = ?`).run(
    nextHidden,
    nextStatus,
    now,
    projectId,
  );
  logAdminAction(db, {
    adminUserId: adminUser.id,
    action: "project_admin_update",
    targetType: "project",
    targetId: projectId,
    detail: `hidden=${nextHidden},status=${nextStatus}`,
  });
  const updated = db.prepare(`SELECT * FROM owner_project_drafts WHERE id = ?`).get(projectId);
  return rowToPublicProperty(db, updated);
}

export function adminDeleteMemberProject(db, adminUser, projectId) {
  const row = db.prepare(`SELECT * FROM owner_project_drafts WHERE id = ?`).get(projectId);
  if (!row) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  db.prepare(`DELETE FROM owner_project_drafts WHERE id = ?`).run(projectId);
  logAdminAction(db, {
    adminUserId: adminUser.id,
    action: "project_admin_deleted",
    targetType: "project",
    targetId: projectId,
  });
  return true;
}
