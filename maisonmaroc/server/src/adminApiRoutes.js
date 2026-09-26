import {
  createUser,
  findUserByEmail,
  hashPassword,
  rejectRoleInBody,
  sanitizeUser,
  verifyPassword,
  assertActiveUser,
  ROLES,
} from "./auth.js";
import { deleteOwner, findOwner, listOwners, updateOwner } from "./users.js";
import { listPropertiesForOwnerProfile } from "./catalog.js";
import { registerAdminContentRoutes } from "./adminContentRoutes.js";
import { registerAdminMemberRoutes } from "./adminMemberRoutes.js";
import { validateUuid } from "./validateIds.js";
import { logSecurityEvent } from "./securityLog.js";
import { sendEmailVerification, isEmailConfigured } from "./authVerification.js";
import { loginAdminUser, clearAdminAuthCookie } from "./adminAuth.js";

export function registerAdminApiRoutes(app, db, deps) {
  const {
    requireAuth,
    requireSuperAdmin,
    authLimiter,
    adminMutationLimiter,
    uploadLimiter,
    handleAuthError,
  } = deps;

  app.post("/api/auth/admin/login", authLimiter, (req, res) => {
    try {
      const { email, password } = req.body || {};
      const row = findUserByEmail(db, email || "");
      if (!row || row.role !== ROLES.SUPER_ADMIN) {
        logSecurityEvent("auth_failure", { route: "admin_login", ip: req.ip });
        const err = new Error("Invalid credentials");
        err.status = 401;
        throw err;
      }
      if (!verifyPassword(password, row.password_hash)) {
        logSecurityEvent("auth_failure", { route: "admin_login", ip: req.ip });
        const err = new Error("Invalid credentials");
        err.status = 401;
        throw err;
      }
      assertActiveUser(row);
      logSecurityEvent("admin_login_success", { userId: row.id, ip: req.ip });
      const out = loginAdminUser(res, row);
      res.json(out);
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    clearAdminAuthCookie(res);
    res.json({ ok: true });
  });

  app.get("/api/auth/me", requireAuth, requireSuperAdmin, (req, res) => {
    res.json({ user: req.user });
  });

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
      if (isEmailConfigured()) {
        await sendEmailVerification(db, row);
      }
      res.status(201).json({
        owner: sanitizeUser(row),
        verificationEmailSent: isEmailConfigured(),
      });
    } catch (err) {
      handleAuthError(err, res);
    }
  });

  app.get("/api/admin/owners/:id", requireAuth, requireSuperAdmin, (req, res) => {
    const idCheck = validateUuid(req.params.id);
    if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
    const owner = findOwner(db, idCheck.value);
    if (!owner) return res.status(404).json({ error: "Not found" });
    res.json({ owner });
  });

  app.patch("/api/admin/owners/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      rejectRoleInBody(req.body);
      const idCheck = validateUuid(req.params.id);
      if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
      const existing = findOwner(db, idCheck.value);
      if (!existing) return res.status(404).json({ error: "Not found" });
      const { name, phone, status, ownerProfileId, password, email } = req.body || {};
      if (email && findUserByEmail(db, email) && findUserByEmail(db, email).id !== idCheck.value) {
        return res.status(409).json({ error: "Email already in use" });
      }
      const updated = updateOwner(db, idCheck.value, {
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
    const idCheck = validateUuid(req.params.id);
    if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
    if (req.user?.id === idCheck.value) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    if (!deleteOwner(db, idCheck.value)) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ ok: true });
  });

  app.get("/api/admin/owners/:id/properties", requireAuth, requireSuperAdmin, (req, res) => {
    const idCheck = validateUuid(req.params.id);
    if (!idCheck.ok) return res.status(404).json({ error: "Not found" });
    const owner = findOwner(db, idCheck.value);
    if (!owner) return res.status(404).json({ error: "Not found" });
    const profileId = owner.owner_profile_id;
    if (!profileId) return res.json({ properties: [] });
    res.json({ properties: listPropertiesForOwnerProfile(db, profileId) });
  });

  registerAdminContentRoutes(app, db, {
    requireAuth,
    requireSuperAdmin,
    adminMutationLimiter,
    uploadLimiter,
  });

  registerAdminMemberRoutes(app, db, {
    requireAuth,
    requireSuperAdmin,
    adminMutationLimiter,
  });
}
