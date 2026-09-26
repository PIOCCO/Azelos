import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";

export const TOKEN_PURPOSE = {
  EMAIL_VERIFY: "email_verify",
  PASSWORD_RESET: "password_reset",
};

const DEFAULT_TTL = {
  [TOKEN_PURPOSE.EMAIL_VERIFY]: () =>
    Number(process.env.EMAIL_VERIFY_TTL_HOURS) || 48,
  [TOKEN_PURPOSE.PASSWORD_RESET]: () =>
    Number(process.env.PASSWORD_RESET_TTL_HOURS) || 2,
};

const MAX_ATTEMPTS = Number(process.env.AUTH_TOKEN_MAX_ATTEMPTS) || 5;

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

function generateRawToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function invalidateActiveTokens(db, userId, purpose) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL`,
  ).run(now, userId, purpose);
}

export function createAuthToken(db, userId, purpose) {
  invalidateActiveTokens(db, userId, purpose);
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const ttlHours = DEFAULT_TTL[purpose]?.() ?? 24;
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO auth_tokens (id, user_id, purpose, token_hash, expires_at, attempt_count, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
  ).run(id, userId, purpose, tokenHash, expiresAt, now);
  return { raw, expiresAt };
}

function findTokenRow(db, purpose, raw) {
  const tokenHash = hashToken(raw);
  return db
    .prepare(
      `SELECT * FROM auth_tokens WHERE purpose = ? AND token_hash = ? LIMIT 1`,
    )
    .get(purpose, tokenHash);
}

export function consumeAuthToken(db, purpose, raw) {
  const token = String(raw || "").trim();
  if (!token || token.length > 256) {
    return { ok: false, error: "Invalid token", status: 400 };
  }

  const row = findTokenRow(db, purpose, token);
  if (!row) {
    return { ok: false, error: "Invalid token", status: 400 };
  }

  if (row.used_at) {
    return { ok: false, error: "Token already used", status: 400 };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Token expired", status: 400 };
  }

  if (row.attempt_count >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts", status: 429 };
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE auth_tokens SET used_at = ? WHERE id = ?`).run(now, row.id);
  return { ok: true, userId: row.user_id };
}

export function recordFailedTokenAttempt(db, purpose, raw) {
  const row = findTokenRow(db, purpose, String(raw || "").trim());
  if (!row || row.used_at) return;
  db.prepare(`UPDATE auth_tokens SET attempt_count = attempt_count + 1 WHERE id = ?`).run(row.id);
}
