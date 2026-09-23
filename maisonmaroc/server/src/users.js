import { hashPassword } from "./auth.js";

export function listOwners(db) {
  return db
    .prepare(
      `SELECT id, email, name, phone, role, status, owner_profile_id, created_at, updated_at
       FROM users WHERE role = 'REAL_ESTATE_OWNER' ORDER BY created_at DESC`,
    )
    .all();
}

export function updateOwner(db, id, fields) {
  const allowed = ["name", "phone", "status", "owner_profile_id", "email"];
  const sets = [];
  const values = [];
  const normalized = { ...fields };
  if (fields.ownerProfileId !== undefined) {
    normalized.owner_profile_id = fields.ownerProfileId;
  }
  for (const key of allowed) {
    if (normalized[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(normalized[key]);
    }
  }
  if (fields.password) {
    sets.push("password_hash = ?");
    values.push(hashPassword(fields.password));
  }
  if (!sets.length) return findOwner(db, id);
  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  db.prepare(
    `UPDATE users SET ${sets.join(", ")} WHERE id = ? AND role = 'REAL_ESTATE_OWNER'`,
  ).run(...values);
  return findOwner(db, id);
}

export function findOwner(db, id) {
  return db
    .prepare(
      `SELECT id, email, name, phone, role, status, owner_profile_id, created_at, updated_at
       FROM users WHERE id = ? AND role = 'REAL_ESTATE_OWNER'`,
    )
    .get(id);
}

export function deleteOwner(db, id) {
  const r = db
    .prepare(`DELETE FROM users WHERE id = ? AND role = 'REAL_ESTATE_OWNER'`)
    .run(id);
  return r.changes > 0;
}
