import { openDb, migrate } from "../src/db.js";

/** Test-only: mark a user verified (integration tests when server lacks SMTP capture). */
export function markUserEmailVerified(email) {
  const db = openDb();
  migrate(db);
  db.prepare(`UPDATE users SET email_verified_at = datetime('now'), updated_at = datetime('now') WHERE email = ? COLLATE NOCASE`).run(
    String(email).trim().toLowerCase(),
  );
  db.close();
}
