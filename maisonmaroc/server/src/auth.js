import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  REAL_ESTATE_OWNER: "REAL_ESTATE_OWNER",
  CLIENT: "CLIENT",
};

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 12);
}

export function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    status: row.status,
    authProvider: row.auth_provider,
    ownerProfileId: row.owner_profile_id,
    createdAt: row.created_at,
  };
}

export function findUserByEmail(db, email) {
  return db
    .prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`)
    .get(email.trim());
}

export function findUserById(db, id) {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
}

export function findUserByGoogleSubject(db, sub) {
  return db.prepare(`SELECT * FROM users WHERE google_subject = ?`).get(sub);
}

export function createUser(db, input) {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (
      id, email, password_hash, name, phone, role, status,
      auth_provider, google_subject, owner_profile_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.email.trim().toLowerCase(),
    input.passwordHash ?? null,
    input.name,
    input.phone ?? null,
    input.role,
    input.status ?? "ACTIVE",
    input.authProvider ?? "local",
    input.googleSubject ?? null,
    input.ownerProfileId ?? null,
    now,
    now,
  );
  return findUserById(db, id);
}

export function assertActiveUser(user) {
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  if (user.status === "DISABLED") {
    const err = new Error("Account disabled");
    err.status = 403;
    throw err;
  }
}

export function rejectRoleInBody(body) {
  if (body && typeof body.role === "string" && body.role.trim()) {
    const err = new Error("Role cannot be set via this endpoint");
    err.status = 400;
    throw err;
  }
}
