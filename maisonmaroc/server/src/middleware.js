import {
  verifyToken,
  findUserById,
  sanitizeUser,
  assertActiveUser,
  signToken,
  ROLES,
} from "./auth.js";
import { assertEmailVerifiedForLogin } from "./authVerification.js";

const COOKIE_NAME = "apio_token";

export { COOKIE_NAME };

export function parseOrigins() {
  const raw =
    process.env.ALLOWED_ORIGINS ||
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5173";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Non-production: allow Vite dev over LAN / Tailscale (e.g. http://100.x.x.x:5173). */
export function isDevLanOrigin(origin) {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.ALLOW_DEV_LAN_ORIGINS === "false") return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^100\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    return false;
  } catch {
    return false;
  }
}

function cookieSecureDefault() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function setAuthCookie(res, token) {
  const secure = cookieSecureDefault();
  const sameSite = process.env.COOKIE_SAME_SITE || "lax";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    secure: cookieSecureDefault(),
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
  });
}

export function attachUser(db) {
  return (req, res, next) => {
    req.user = null;
    const token = req.cookies?.[COOKIE_NAME] || bearerToken(req);
    if (!token) return next();
    try {
      const payload = verifyToken(token);
      const row = findUserById(db, payload.sub);
      if (row && row.status === "ACTIVE") {
        req.user = sanitizeUser(row);
        req.userRow = row;
      }
    } catch {
      clearAuthCookie(res);
    }
    next();
  };
}

function bearerToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7);
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);
export const requireOwner = requireRole(ROLES.REAL_ESTATE_OWNER);
export const requireClient = requireRole(ROLES.CLIENT);

export function loginUser(db, res, userRow) {
  assertActiveUser(userRow);
  assertEmailVerifiedForLogin(userRow);
  const token = signAndSet(res, userRow);
  return { user: sanitizeUser(userRow), token };
}

function signAndSet(res, userRow) {
  const token = signToken(userRow);
  setAuthCookie(res, token);
  return token;
}

export function handleAuthError(err, res) {
  const status = err.status || 500;
  const message =
    status >= 500 ? "Internal server error" : err.message || "Request failed";
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}
