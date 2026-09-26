import jwt from "jsonwebtoken";
import { findUserById, sanitizeUser, assertActiveUser, ROLES } from "./auth.js";

export const ADMIN_COOKIE_NAME = "apio_admin_token";

function adminJwtSecret() {
  const dedicated = process.env.APIO_ADMIN_JWT_SECRET?.trim();
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APIO_ADMIN_JWT_SECRET is required in production for the admin server");
  }
  return process.env.JWT_SECRET || "dev-insecure-secret";
}

const ADMIN_JWT_EXPIRES_IN = process.env.APIO_ADMIN_JWT_EXPIRES_IN || "8h";

export function signAdminToken(userRow) {
  if (userRow.role !== ROLES.SUPER_ADMIN) {
    throw new Error("Invalid admin account");
  }
  return jwt.sign(
    { sub: userRow.id, role: userRow.role, email: userRow.email, aud: "apio-admin" },
    adminJwtSecret(),
    { expiresIn: ADMIN_JWT_EXPIRES_IN },
  );
}

export function verifyAdminToken(token) {
  const payload = jwt.verify(token, adminJwtSecret());
  if (payload.aud !== "apio-admin") {
    const err = new Error("Invalid token");
    err.status = 401;
    throw err;
  }
  return payload;
}

function cookieSecureDefault() {
  if (process.env.ADMIN_COOKIE_SECURE === "true") return true;
  if (process.env.ADMIN_COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function setAdminAuthCookie(res, token) {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecureDefault(),
    sameSite: process.env.ADMIN_COOKIE_SAME_SITE || "strict",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAdminAuthCookie(res) {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    secure: cookieSecureDefault(),
    sameSite: process.env.ADMIN_COOKIE_SAME_SITE || "strict",
  });
}

export function attachAdminUser(db) {
  return (req, res, next) => {
    req.user = null;
    req.userRow = null;
    const token = req.cookies?.[ADMIN_COOKIE_NAME];
    if (!token) return next();
    try {
      const payload = verifyAdminToken(token);
      const row = findUserById(db, payload.sub);
      if (row && row.status === "ACTIVE" && row.role === ROLES.SUPER_ADMIN) {
        req.user = sanitizeUser(row);
        req.userRow = row;
      }
    } catch {
      clearAdminAuthCookie(res);
    }
    next();
  };
}

/** Super-admin session on admin port (no public-site cookie). */
export function loginAdminUser(res, userRow) {
  assertActiveUser(userRow);
  if (userRow.role !== ROLES.SUPER_ADMIN) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  const token = signAdminToken(userRow);
  setAdminAuthCookie(res, token);
  return { user: sanitizeUser(userRow) };
}
