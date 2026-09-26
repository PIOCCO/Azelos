import { randomUUID } from "node:crypto";

export function logAdminAction(db, { adminUserId, action, targetType, targetId, detail }) {
  db.prepare(
    `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    adminUserId,
    action,
    targetType || null,
    targetId ? String(targetId).slice(0, 128) : null,
    detail ? String(detail).slice(0, 500) : null,
    new Date().toISOString(),
  );
}
