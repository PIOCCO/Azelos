import {
  verifyToken,
  findUserById,
  sanitizeUser,
  assertActiveUser,
  signToken,
  ROLES,
} from "./auth.js";

const COOKIE_NAME = "apio_token";

export { COOKIE_NAME };

export function parseOrigins() {
  const raw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function setAuthCookie(res, token) {
  const secure = process.env.COOKIE_SECURE === "true";
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
  res.clearCookie(COOKIE_NAME, { path: "/" });
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
