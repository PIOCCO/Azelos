import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { openDb, migrate } from "./db.js";
import {
  ROLES,
  createUser,
  findUserByEmail,
  findUserByGoogleSubject,
  findUserById,
  hashPassword,
  rejectRoleInBody,
  sanitizeUser,
  verifyPassword,
  assertActiveUser,
} from "./auth.js";
import {
  attachUser,
  clearAuthCookie,
  handleAuthError,
  loginUser,
  parseOrigins,
  requireAuth,
  requireSuperAdmin,
  requireOwner,
} from "./middleware.js";
import {
  createOAuthState,
  consumeOAuthState,
  exchangeCodeForProfile,
  googleAuthUrl,
  isGoogleConfigured,
  isGoogleRedirectConfigured,
  verifyIdToken,
} from "./google.js";
import { deleteOwner, findOwner, listOwners, updateOwner } from "./users.js";
import {
  getPropertyBySlugOrId,
  listPropertiesForOwnerProfile,
  listPublicProperties,
} from "./catalog.js";

const db = openDb();
migrate(db);

const app = express();
const port = Number(process.env.PORT) || 3001;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: parseOrigins(),
    credentials: true,
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(attachUser(db));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// ——— Public catalog (marketplace remains public) ———
app.get("/api/properties", (_req, res) => {
  res.json({ properties: listPublicProperties() });
});

app.get("/api/properties/:slugOrId", (req, res) => {
  const p = getPropertyBySlugOrId(req.params.slugOrId);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json({ property: p });
});

// ——— Client registration / login ———
app.post("/api/auth/client/register", authLimiter, async (req, res) => {
  try {
    rejectRoleInBody(req.body);
    const { email, password, name, phone } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (findUserByEmail(db, email)) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    const row = createUser(db, {
      email,
      passwordHash: hashPassword(password),
      name: String(name).trim(),
      phone: phone ? String(phone) : null,
      role: ROLES.CLIENT,
      authProvider: "local",
    });
    loginUser(db, res, row);
    res.status(201).json({ user: sanitizeUser(row) });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.post("/api/auth/client/login", authLimiter, (req, res) => {
  try {
    const { email, password } = req.body || {};
    const row = findUserByEmail(db, email || "");
    if (!row || row.role !== ROLES.CLIENT) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    if (!verifyPassword(password, row.password_hash)) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    assertActiveUser(row);
    loginUser(db, res, row);
    res.json({ user: sanitizeUser(row) });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.post("/api/auth/owner/login", authLimiter, (req, res) => {
  try {
    const { email, password } = req.body || {};
    const row = findUserByEmail(db, email || "");
    if (!row || row.role !== ROLES.REAL_ESTATE_OWNER) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    if (!verifyPassword(password, row.password_hash)) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    assertActiveUser(row);
    loginUser(db, res, row);
    res.json({ user: sanitizeUser(row) });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.post("/api/auth/admin/login", authLimiter, (req, res) => {
  try {
    const { email, password } = req.body || {};
    const row = findUserByEmail(db, email || "");
    if (!row || row.role !== ROLES.SUPER_ADMIN) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    if (!verifyPassword(password, row.password_hash)) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    assertActiveUser(row);
    loginUser(db, res, row);
    res.json({ user: sanitizeUser(row) });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.post("/api/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ——— Google OAuth (CLIENT only) ———
async function handleGoogleProfile(res, profile) {
  let row = findUserByGoogleSubject(db, profile.sub);
  if (row) {
    assertActiveUser(row);
    if (row.role !== ROLES.CLIENT) {
      const err = new Error("This Google account cannot be used for client login");
      err.status = 403;
      throw err;
    }
    loginUser(db, res, row);
    return sanitizeUser(row);
  }

  row = findUserByEmail(db, profile.email);
  if (row) {
    if (row.role !== ROLES.CLIENT) {
      const err = new Error("This email is registered as a privileged account");
      err.status = 403;
      throw err;
    }
    db.prepare(
      `UPDATE users SET google_subject = ?, auth_provider = 'google', updated_at = ? WHERE id = ?`,
    ).run(profile.sub, new Date().toISOString(), row.id);
    row = findUserById(db, row.id);
    assertActiveUser(row);
    loginUser(db, res, row);
    return sanitizeUser(row);
  }

  row = createUser(db, {
    email: profile.email,
    name: profile.name,
    role: ROLES.CLIENT,
    authProvider: "google",
    googleSubject: profile.sub,
  });
  loginUser(db, res, row);
  return sanitizeUser(row);
}

app.get("/api/auth/google", (req, res) => {
  try {
    if (!isGoogleRedirectConfigured()) {
      return res.status(503).json({ error: "Google OAuth redirect is not configured" });
    }
    const state = createOAuthState();
    res.redirect(googleAuthUrl(state));
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.get("/api/auth/google/callback", async (req, res) => {
  try {
    if (!isGoogleConfigured()) {
      return res.redirect(`${frontendUrl}/client/login?error=oauth_not_configured`);
    }
    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(`${frontendUrl}/client/login?error=oauth_cancelled`);
    }
    consumeOAuthState(String(state || ""));
    const profile = await exchangeCodeForProfile(String(code || ""));
    await handleGoogleProfile(res, profile);
    res.redirect(`${frontendUrl}/client/account`);
  } catch (err) {
    console.error("Google callback error", err.message);
    res.redirect(`${frontendUrl}/client/login?error=oauth_failed`);
  }
});

app.post("/api/auth/google", authLimiter, async (req, res) => {
  try {
    if (!isGoogleConfigured()) {
      return res.status(503).json({ error: "Google client ID is not configured on the server" });
    }
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }
    const profile = await verifyIdToken(idToken);
    const user = await handleGoogleProfile(res, profile);
    res.json({ user });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.get("/api/auth/google/config", (_req, res) => {
  res.json({
    enabled: isGoogleConfigured(),
    clientId: process.env.GOOGLE_CLIENT_ID || null,
  });
});

// ——— Owner portal (scoped to JWT, never ?owner_id=) ———
app.get("/api/owner/properties", requireAuth, requireOwner, (req, res) => {
  const ownerProfileId = req.user.ownerProfileId;
  if (!ownerProfileId) {
    return res.json({ properties: [] });
  }
  res.json({ properties: listPropertiesForOwnerProfile(ownerProfileId) });
});

app.get("/api/owner/me", requireAuth, requireOwner, (req, res) => {
  res.json({ user: req.user });
});

// ——— Admin owner management ———
app.get("/api/admin/owners", requireAuth, requireSuperAdmin, (_req, res) => {
  res.json({ owners: listOwners(db) });
});

app.post("/api/admin/owners", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    rejectRoleInBody(req.body);
    const { email, password, name, phone, ownerProfileId, status } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (findUserByEmail(db, email)) {
      return res.status(409).json({ error: "Email already in use" });
    }
    const row = createUser(db, {
      email,
      passwordHash: hashPassword(password),
      name: String(name).trim(),
      phone: phone ? String(phone) : null,
      role: ROLES.REAL_ESTATE_OWNER,
      status: status === "DISABLED" ? "DISABLED" : "ACTIVE",
      ownerProfileId: ownerProfileId ? String(ownerProfileId) : null,
      authProvider: "local",
    });
    res.status(201).json({ owner: sanitizeUser(row) });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.get("/api/admin/owners/:id", requireAuth, requireSuperAdmin, (req, res) => {
  const owner = findOwner(db, req.params.id);
  if (!owner) return res.status(404).json({ error: "Not found" });
  res.json({ owner });
});

app.patch("/api/admin/owners/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    rejectRoleInBody(req.body);
    const existing = findOwner(db, req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const { name, phone, status, ownerProfileId, password, email } = req.body || {};
    if (email && findUserByEmail(db, email) && findUserByEmail(db, email).id !== req.params.id) {
      return res.status(409).json({ error: "Email already in use" });
    }
    const updated = updateOwner(db, req.params.id, {
      name,
      phone,
      status,
      ownerProfileId,
      email,
      password,
    });
    res.json({ owner: updated });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.delete("/api/admin/owners/:id", requireAuth, requireSuperAdmin, (req, res) => {
  if (!deleteOwner(db, req.params.id)) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({ ok: true });
});

app.get("/api/admin/owners/:id/properties", requireAuth, requireSuperAdmin, (req, res) => {
  const owner = findOwner(db, req.params.id);
  if (!owner) return res.status(404).json({ error: "Not found" });
  res.json({
    properties: listPropertiesForOwnerProfile(owner.owner_profile_id),
  });
});

// Block legacy public owner registration
app.post("/api/auth/owner/register", (_req, res) => {
  res.status(403).json({ error: "Owner accounts can only be created by a super admin" });
});
app.post("/api/auth/register", (req, res, next) => {
  if (req.body?.role === ROLES.REAL_ESTATE_OWNER || req.body?.role === ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: "Invalid registration" });
  }
  req.url = "/api/auth/client/register";
  app.handle(req, res, next);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`APIO API listening on http://localhost:${port}`);
});
