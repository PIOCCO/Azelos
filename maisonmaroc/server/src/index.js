import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs";
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
  isDevLanOrigin,
  loginUser,
  parseOrigins,
  requireAuth,
  requireOwner,
  requireClient,
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
import {
  getPropertyBySlugOrId,
  listPropertiesForOwnerProfile,
  listPublicProperties,
} from "./catalog.js";
import {
  createContactSubmission,
  getNewsBySlug,
  getPublicDocumentFile,
  publicDownloadFilename,
  contentDispositionAttachment,
  listPublicDocuments,
  listPublishedEvents,
  listPublishedNews,
  syncApioDocuments,
} from "./content.js";
import { validateContactBody } from "./contact.js";
import { registerOwnerRoutes } from "./ownerRoutes.js";
import { blockPublicAdminAccess } from "./publicAdminGuard.js";
import {
  getPublishedMemberProperty,
  getPublicProjectImage,
  listPublishedMemberProperties,
} from "./memberListings.js";
import { getMemberProfileById, listPublicMemberProfiles, profileToPublicOwner } from "./memberProfiles.js";
import { getPublicMemberAvatarFile, getPublicMemberProfile } from "./ownerPortal.js";

function publicOwnerForProfileId(db, ownerProfileId) {
  const profile = getPublicMemberProfile(db, ownerProfileId);
  return profile ? profileToPublicOwner(profile) : null;
}
import { applySecurityMiddleware } from "./security.js";
import {
  rejectPrototypePollutionMiddleware,
  trustedHostMiddleware,
} from "./requestSecurity.js";
import {
  rejectUnexpectedBodyKeys,
  validateOptionalPhone,
  validatePersonName,
} from "./validateUserText.js";
import { PRIVILEGED_ESCALATION_FIELDS, rejectForbiddenBodyFields } from "./securityFields.js";
import { clampPagination, validateSlug, EMAIL_RE } from "./validateContent.js";
import { ensureUploadDir, resolveStoredFile } from "./uploads.js";
import {
  addMessage,
  archiveConversation,
  canAccessConversation,
  createConversation,
  getConversation,
  listConversationsForUser,
  listMessages,
  markConversationRead,
  unreadCountForUser,
  validateConversationPayload,
  validateMessageBody,
} from "./messages.js";
import { assertServerConfig } from "./startup.js";
import { frontendRedirect } from "./redirect.js";
import { validateDocumentId, validateUuid } from "./validateIds.js";
import { logSecurityEvent } from "./securityLog.js";
import { validatePasswordPolicy } from "./passwordPolicy.js";
import {
  sendEmailVerification,
  sendPasswordReset,
  verifyEmailWithToken,
  resendVerificationEmail,
  resetPasswordWithToken,
  isEmailConfigured,
} from "./authVerification.js";
import { setUserPassword } from "./auth.js";

assertServerConfig();

const db = openDb();
migrate(db);
ensureUploadDir();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.set("trust proxy", 1);
applySecurityMiddleware(app);
app.use(trustedHostMiddleware);
app.use(express.json({ limit: "32kb" }));
app.use(rejectPrototypePollutionMiddleware);
app.use(cookieParser());
app.use(attachUser(db));
app.use(blockPublicAdminAccess());
app.use(
  cors({
    origin(origin, callback) {
      const allowed = parseOrigins();
      if (!origin || allowed.includes(origin) || isDevLanOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

const rateLimitJson = (message) => ({
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: message, code: "RATE_LIMIT" });
  },
});

const authEmailLimiter = rateLimit({
  ...rateLimitJson("Too many email requests"),
  max: Number(process.env.AUTH_EMAIL_RATE_MAX) || 10,
  windowMs: 60 * 60 * 1000,
});

const authLimiter = rateLimit({
  ...rateLimitJson("Too many authentication attempts"),
  max: process.env.NODE_ENV === "production" ? 30 : 120,
  skipSuccessfulRequests: true,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: "Too many contact requests", code: "RATE_LIMIT" });
  },
});

const publicContentLimiter = rateLimit({
  ...rateLimitJson("Too many requests"),
  windowMs: 60 * 1000,
  max: 120,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: "Too many uploads", code: "RATE_LIMIT" });
  },
});

const ownerMutationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: "Too many requests", code: "RATE_LIMIT" });
  },
});

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: "Too many messages", code: "RATE_LIMIT" });
  },
});

app.get("/api/health", (_req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// ——— Public catalog (marketplace remains public) ———
app.get("/api/properties", (_req, res) => {
  res.json({ properties: listPublicProperties(db) });
});

app.get("/api/properties/:slugOrId", (req, res) => {
  const p = getPropertyBySlugOrId(db, req.params.slugOrId);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json({ property: p });
});

app.get("/api/public/members", publicContentLimiter, (_req, res) => {
  const profiles = listPublicMemberProfiles(db);
  const members = profiles
    .map((p) => {
      const merged = getPublicMemberProfile(db, p.id);
      return merged ? profileToPublicOwner(merged) : profileToPublicOwner(p);
    })
    .filter(Boolean);
  res.json({ members });
});

app.get("/api/listings/member-properties", publicContentLimiter, (_req, res) => {
  const properties = listPublishedMemberProperties(db);
  const ownerIds = [...new Set(properties.map((p) => p.ownerId))];
  const owners = ownerIds.map((id) => publicOwnerForProfileId(db, id)).filter(Boolean);
  res.json({ properties, owners });
});

app.get("/api/listings/member-properties/:slugOrId", publicContentLimiter, (req, res) => {
  const property = getPublishedMemberProperty(db, req.params.slugOrId);
  if (!property) return res.status(404).json({ error: "Not found" });
  const owner = publicOwnerForProfileId(db, property.ownerId);
  res.json({ property, owner: owner || null });
});

app.get("/api/public/member-profiles/:ownerProfileId", publicContentLimiter, (req, res) => {
  const id = String(req.params.ownerProfileId || "").slice(0, 128);
  const profile = getPublicMemberProfile(db, id);
  if (!profile) return res.status(404).json({ error: "Not found" });
  res.json({ profile });
});

app.get("/api/public/member-avatars/:ownerProfileId/file", publicContentLimiter, (req, res) => {
  const id = String(req.params.ownerProfileId || "").slice(0, 128);
  const file = getPublicMemberAvatarFile(db, id);
  if (!file) return res.status(404).json({ error: "Not found" });
  const abs = resolveStoredFile(file.storageName);
  if (!abs) return res.status(404).json({ error: "Not found" });
  res.setHeader("Content-Type", file.mime);
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.query.v) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
  }
  fs.createReadStream(abs).pipe(res);
});

app.get("/api/listings/project-images/:imageId/file", publicContentLimiter, (req, res) => {
  const file = getPublicProjectImage(db, req.params.imageId);
  if (!file) return res.status(404).json({ error: "Not found" });
  const abs = resolveStoredFile(file.storageName);
  if (!abs) return res.status(404).json({ error: "Not found" });
  res.setHeader("Content-Type", file.mime);
  res.setHeader("X-Content-Type-Options", "nosniff");
  fs.createReadStream(abs).pipe(res);
});

app.get("/api/content/news", publicContentLimiter, (req, res) => {
  const { limit, offset } = clampPagination(req.query);
  res.json({ articles: listPublishedNews(db, { limit, offset }) });
});

app.get("/api/content/news/:slug", publicContentLimiter, (req, res) => {
  const slugCheck = validateSlug(req.params.slug);
  if (!slugCheck.ok) return res.status(404).json({ error: "Not found" });
  const article = getNewsBySlug(db, slugCheck.value);
  if (!article) return res.status(404).json({ error: "Not found" });
  res.json({ article });
});

app.get("/api/content/events", publicContentLimiter, (req, res) => {
  const upcoming = req.query.upcoming === "1";
  res.json({ events: listPublishedEvents(db, { upcomingOnly: upcoming }) });
});

app.get("/api/content/documents", publicContentLimiter, (_req, res) => {
  res.json({ documents: listPublicDocuments(db) });
});

app.get("/api/content/documents/:id/file", publicContentLimiter, (req, res) => {
  const idCheck = validateDocumentId(req.params.id);
  if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
  const doc = getPublicDocumentFile(db, idCheck.value);
  if (!doc || !doc.file_storage) return res.status(404).json({ error: "Not found" });
  const mime = String(doc.file_mime || "").toLowerCase();
  if (!mime.includes("pdf")) return res.status(404).json({ error: "Not found" });
  const abs = resolveStoredFile(doc.file_storage);
  if (!abs) return res.status(404).json({ error: "Not found" });
  const filename = publicDownloadFilename(doc.title_fr, doc.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", contentDispositionAttachment(filename));
  fs.createReadStream(abs).pipe(res);
});

app.post("/api/contact", contactLimiter, (req, res) => {
  const result = validateContactBody(req.body);
  if (!result.ok) {
    return res.status(400).json({ error: "Validation failed", details: result.errors });
  }
  createContactSubmission(db, result.data, req.ip);
  res.status(201).json({ ok: true });
});

// ——— Client registration / login ———
app.post("/api/auth/client/register", authLimiter, async (req, res) => {
  try {
    rejectRoleInBody(req.body);
    rejectForbiddenBodyFields(req.body, PRIVILEGED_ESCALATION_FIELDS);
    rejectUnexpectedBodyKeys(req.body, ["email", "password", "name", "phone"]);
    const { email, password, name, phone } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > 254) {
      return res.status(400).json({ error: "Invalid email" });
    }
    const passCheck = validatePasswordPolicy(password);
    if (!passCheck.ok) {
      return res.status(400).json({ error: passCheck.error });
    }
    const nameCheck = validatePersonName(name);
    if (!nameCheck.ok) {
      return res.status(400).json({ error: nameCheck.error });
    }
    const phoneCheck = validateOptionalPhone(phone);
    if (!phoneCheck.ok) {
      return res.status(400).json({ error: phoneCheck.error });
    }
    if (!isEmailConfigured()) {
      return res.status(503).json({
        error: "Email delivery is not configured. Registration is unavailable.",
        code: "EMAIL_NOT_CONFIGURED",
      });
    }
    if (findUserByEmail(db, normalizedEmail)) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    const row = createUser(db, {
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      name: nameCheck.value,
      phone: phoneCheck.value,
      role: ROLES.CLIENT,
      authProvider: "local",
    });
    await sendEmailVerification(db, row);
    res.status(201).json({
      ok: true,
      message: "Account created. Check your email to verify before signing in.",
      email: normalizedEmail,
    });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.post("/api/auth/client/login", authLimiter, (req, res) => {
  try {
    const { email, password } = req.body || {};
    const row = findUserByEmail(db, email || "");
    if (!row || row.role !== ROLES.CLIENT) {
      logSecurityEvent("auth_failure", { route: "client_login", ip: req.ip });
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    if (!verifyPassword(password, row.password_hash)) {
      logSecurityEvent("auth_failure", { route: "client_login", ip: req.ip });
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
      logSecurityEvent("auth_failure", { route: "owner_login", ip: req.ip });
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    if (!verifyPassword(password, row.password_hash)) {
      logSecurityEvent("auth_failure", { route: "owner_login", ip: req.ip });
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

app.get("/api/auth/email/status", (_req, res) => {
  res.json({
    emailConfigured: isEmailConfigured(),
    phoneOtpConfigured: false,
  });
});

app.post("/api/auth/verify-email", authLimiter, (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) return res.status(400).json({ error: "Token is required" });
    const result = verifyEmailWithToken(db, token);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true, message: "Email verified. You can sign in now." });
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.post("/api/auth/verify-email/resend", authEmailLimiter, async (req, res) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(503).json({ error: "Email delivery is not configured", code: "EMAIL_NOT_CONFIGURED" });
    }
    const { email } = req.body || {};
    const out = await resendVerificationEmail(db, email);
    res.json(out);
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.post("/api/auth/password/forgot", authEmailLimiter, async (req, res) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(503).json({ error: "Email delivery is not configured", code: "EMAIL_NOT_CONFIGURED" });
    }
    const out = await sendPasswordReset(db, req.body?.email);
    res.json(out);
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.post("/api/auth/password/reset", authLimiter, (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const { password } = req.body || {};
    const passCheck = validatePasswordPolicy(password);
    if (!passCheck.ok) return res.status(400).json({ error: passCheck.error });
    const result = resetPasswordWithToken(db, token, password);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    setUserPassword(db, result.userId, password);
    res.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (err) {
    handleAuthError(err, res);
  }
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
    if (row.owner_profile_id) {
      const err = new Error("Invalid client account configuration");
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
    if (row.owner_profile_id) {
      const err = new Error("Invalid client account configuration");
      err.status = 403;
      throw err;
    }
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE users SET google_subject = ?, auth_provider = 'google', email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?`,
    ).run(profile.sub, now, now, row.id);
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
    emailVerifiedAt: new Date().toISOString(),
    phone: null,
  });
  loginUser(db, res, row);
  return sanitizeUser(row);
}

app.get("/api/auth/google", (req, res) => {
  try {
    if (!isGoogleRedirectConfigured()) {
      return res.status(503).json({ error: "Google OAuth redirect is not configured" });
    }
    const next = String(req.query.next || "/").slice(0, 512);
    const state = createOAuthState(next);
    res.redirect(googleAuthUrl(state));
  } catch (err) {
    handleAuthError(err, res);
  }
});

app.get("/api/auth/google/callback", async (req, res) => {
  try {
    if (!isGoogleConfigured()) {
      return res.redirect(frontendRedirect("/client/login?error=oauth_not_configured"));
    }
    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(frontendRedirect("/client/login?error=oauth_cancelled"));
    }
    const returnTo = consumeOAuthState(String(state || ""));
    const profile = await exchangeCodeForProfile(String(code || ""));
    await handleGoogleProfile(res, profile);
    res.redirect(frontendRedirect(returnTo));
  } catch (err) {
    console.error("Google callback error", err.message);
    res.redirect(frontendRedirect("/client/login?error=oauth_failed"));
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
  res.json({ properties: listPropertiesForOwnerProfile(db, ownerProfileId) });
});

app.get("/api/owner/me", requireAuth, requireOwner, (req, res) => {
  res.json({ user: req.user });
});

registerOwnerRoutes(app, db, {
  requireAuth,
  requireOwner,
  uploadLimiter,
  ownerMutationLimiter,
});

function serializeConversation(db, conv) {
  const msgs = listMessages(db, conv.id);
  const last = msgs[msgs.length - 1] || null;
  const client = findUserById(db, conv.client_id);
  const property =
    getPropertyBySlugOrId(db, conv.property_slug) || getPropertyBySlugOrId(db, conv.property_id);
  return {
    id: conv.id,
    propertyId: conv.property_id,
    propertySlug: conv.property_slug,
    agentProfileId: conv.agent_profile_id,
    status: conv.status,
    updatedAt: conv.updated_at,
    client: client
      ? { id: client.id, name: client.name, email: client.email }
      : { id: conv.client_id, name: "Client", email: "" },
    propertyPreview: property
      ? { id: property.id, slug: property.slug, title: property.title }
      : { id: conv.property_id, slug: conv.property_slug, title: { fr: conv.property_slug, ar: conv.property_slug } },
    lastMessage: last
      ? { body: last.body, createdAt: last.created_at, senderId: last.sender_id }
      : null,
  };
}

app.get("/api/messages/unread-count", requireAuth, (req, res) => {
  if (![ROLES.CLIENT, ROLES.REAL_ESTATE_OWNER].includes(req.user.role)) {
    return res.json({ count: 0 });
  }
  res.json({ count: unreadCountForUser(db, req.user) });
});

app.get("/api/messages/conversations", requireAuth, (req, res) => {
  if (![ROLES.CLIENT, ROLES.REAL_ESTATE_OWNER].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const q = String(req.query.q || "")
    .slice(0, 200)
    .toLowerCase();
  let rows = listConversationsForUser(db, req.user).map((c) => serializeConversation(db, c));
  if (q) {
    rows = rows.filter(
      (c) =>
        c.client.name.toLowerCase().includes(q) ||
        c.propertyPreview.title.fr.toLowerCase().includes(q) ||
        c.propertyPreview.title.ar.includes(q) ||
        c.lastMessage?.body.toLowerCase().includes(q),
    );
  }
  res.json({ conversations: rows });
});

app.post("/api/messages/conversations", requireAuth, requireClient, messageLimiter, (req, res) => {
  const validated = validateConversationPayload(db, req.body || {});
  if (!validated.ok) return res.status(400).json({ error: validated.error });
  const conv = createConversation(db, {
    clientId: req.user.id,
    ...validated.data,
  });
  res.status(201).json({ conversation: serializeConversation(db, conv) });
});

app.get("/api/messages/conversations/:id", requireAuth, (req, res) => {
  const idCheck = validateUuid(req.params.id);
  if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
  const conv = getConversation(db, idCheck.value);
  if (!canAccessConversation(conv, req.user)) return res.status(404).json({ error: "Not found" });
  markConversationRead(db, conv, req.user);
  const messages = listMessages(db, conv.id).map((m) => ({
    id: m.id,
    body: m.body,
    senderId: m.sender_id,
    createdAt: m.created_at,
  }));
  res.json({
    conversation: serializeConversation(db, conv),
    messages,
  });
});

app.post("/api/messages/conversations/:id/messages", requireAuth, messageLimiter, (req, res) => {
  const idCheck = validateUuid(req.params.id);
  if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
  const conv = getConversation(db, idCheck.value);
  if (!canAccessConversation(conv, req.user)) {
    logSecurityEvent("authz_denied", { route: "messages_post", userId: req.user?.id, conversationId: idCheck.value });
    return res.status(404).json({ error: "Not found" });
  }
  const validated = validateMessageBody(req.body?.body);
  if (!validated.ok) return res.status(400).json({ error: validated.error });
  const msg = addMessage(db, {
    conversationId: conv.id,
    senderId: req.user.id,
    body: validated.value,
  });
  const updated = getConversation(db, conv.id);
  res.status(201).json({
    message: {
      id: msg.id,
      body: msg.body,
      senderId: msg.sender_id,
      createdAt: msg.created_at,
    },
    conversation: serializeConversation(db, updated),
  });
});

app.patch("/api/messages/conversations/:id/read", requireAuth, (req, res) => {
  const idCheck = validateUuid(req.params.id);
  if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
  const conv = getConversation(db, idCheck.value);
  if (!canAccessConversation(conv, req.user)) return res.status(404).json({ error: "Not found" });
  markConversationRead(db, conv, req.user);
  res.json({ ok: true });
});

app.patch("/api/messages/conversations/:id/archive", requireAuth, (req, res) => {
  const idCheck = validateUuid(req.params.id);
  if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
  const conv = getConversation(db, idCheck.value);
  if (!canAccessConversation(conv, req.user)) return res.status(404).json({ error: "Not found" });
  archiveConversation(db, conv, req.user);
  res.json({ ok: true });
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
  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (err?.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message || "Bad request" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

(async () => {
  try {
    await syncApioDocuments(db);
  } catch (err) {
    console.error("[apio-server] Document sync failed:", err.message);
  }
})();

const server = app.listen(port, () => {
  console.log(`APIO API listening on http://localhost:${port}`);
});

function shutdown(signal) {
  console.log(`[apio-server] ${signal} — closing HTTP server`);
  server.close(() => {
    try {
      db.close();
    } catch {
      /* ignore */
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(
      `\n[apio-server] Port ${port} is already in use.\n` +
        `  • Stop the other API process, or\n` +
        `  • Linux: ss -ltnp 'sport = :${port}'  then  kill <pid>\n` +
        `  • Or run with another port: PORT=3002 npm run dev\n`,
    );
    process.exit(1);
  }
  throw err;
});
