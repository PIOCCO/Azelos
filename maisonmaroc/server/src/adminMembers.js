import { hashPassword, createUser, findUserByEmail, ROLES } from "./auth.js";
import { createMemberProfile, getMemberProfileById, updateMemberProfile, profileToPublicOwner } from "./memberProfiles.js";
import { listPropertiesForOwnerProfile } from "./catalog.js";
import { listPublishedMemberProperties, rowToPublicProperty } from "./memberListings.js";
import { logAdminAction } from "./adminAudit.js";
import { listMemberDocuments } from "./content.js";

import { PRIVILEGED_ESCALATION_FIELDS, rejectForbiddenBodyFields } from "./securityFields.js";

function rejectMemberEscalation(body) {
  rejectForbiddenBodyFields(body, PRIVILEGED_ESCALATION_FIELDS);
}

export function listMembersForAdmin(db, { q = "", status = "", sort = "created_desc" } = {}) {
  let rows = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.status, u.owner_profile_id, u.created_at, u.updated_at
       FROM users u WHERE u.role = 'REAL_ESTATE_OWNER'`,
    )
    .all();

  if (status) rows = rows.filter((r) => r.status === status);
  if (q) {
    const qq = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(qq) ||
        r.email.toLowerCase().includes(qq) ||
        (r.owner_profile_id || "").toLowerCase().includes(qq),
    );
  }

  const enriched = rows.map((r) => {
    const profile = getMemberProfileById(db, r.owner_profile_id);
    const seedCount = listPropertiesForOwnerProfile(r.owner_profile_id).length;
    const dbCount = db
      .prepare(
        `SELECT COUNT(*) AS c FROM owner_project_drafts WHERE owner_profile_id = ? AND status = 'published'`,
      )
      .get(r.owner_profile_id)?.c;
    const lastAct = db
      .prepare(
        `SELECT created_at FROM owner_activity_log WHERE owner_profile_id = ? ORDER BY created_at DESC LIMIT 1`,
      )
      .get(r.owner_profile_id)?.created_at;
    return {
      ...r,
      company: profile?.agency?.fr || profile?.name?.fr || null,
      projectCount: seedCount + (dbCount || 0),
      lastActivity: lastAct || r.updated_at,
    };
  });

  enriched.sort((a, b) => {
    if (sort === "name_asc") return (a.company || a.name).localeCompare(b.company || b.name);
    if (sort === "name_desc") return (b.company || b.name).localeCompare(a.company || a.name);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return enriched;
}

export function createMemberWithAccount(db, adminUser, body) {
  rejectMemberEscalation(body);
  const { email, password, name, phone, status, linkExistingProfileId, ...profileFields } = body || {};
  if (!email || !password || !name) {
    const err = new Error("Email, password, and contact name are required");
    err.status = 400;
    throw err;
  }
  if (String(password).length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.status = 400;
    throw err;
  }
  if (findUserByEmail(db, email)) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  let ownerProfileId = linkExistingProfileId ? String(linkExistingProfileId).trim() : null;
  if (!ownerProfileId) {
    const profile = createMemberProfile(db, {
      nameFr: profileFields.legalNameFr || name,
      nameAr: profileFields.legalNameAr || name,
      agencyFr: profileFields.companyFr || profileFields.agencyFr,
      agencyAr: profileFields.companyAr || profileFields.agencyAr,
      cityId: profileFields.cityId,
      phone: profileFields.companyPhone || phone,
      email: profileFields.companyEmail,
      bioFr: profileFields.descriptionFr,
      bioAr: profileFields.descriptionAr,
      website: profileFields.website,
      avatarUrl: profileFields.logoUrl,
      contactName: name,
      contactPosition: profileFields.contactPosition,
      contactPhone: profileFields.contactPhone || phone,
      contactEmail: profileFields.contactEmail || email,
      verified: true,
    });
    ownerProfileId = profile.id;
  }

  const userRow = createUser(db, {
    email,
    passwordHash: hashPassword(password),
    name: String(name).trim(),
    phone: phone ? String(phone) : null,
    role: ROLES.REAL_ESTATE_OWNER,
    status: status === "DISABLED" ? "DISABLED" : "ACTIVE",
    ownerProfileId,
    authProvider: "local",
  });

  logAdminAction(db, {
    adminUserId: adminUser.id,
    action: "member_created",
    targetType: "user",
    targetId: userRow.id,
    detail: ownerProfileId,
  });

  return { user: userRow, ownerProfileId, profile: getMemberProfileById(db, ownerProfileId) };
}

export function getMemberDetailForAdmin(db, userId) {
  const user = db
    .prepare(`SELECT id, email, name, phone, status, owner_profile_id, created_at, updated_at FROM users WHERE id = ? AND role = 'REAL_ESTATE_OWNER'`)
    .get(userId);
  if (!user) return null;
  const profile = getMemberProfileById(db, user.owner_profile_id);
  const seedProjects = listPropertiesForOwnerProfile(user.owner_profile_id);
  const dbRows = db
    .prepare(`SELECT * FROM owner_project_drafts WHERE owner_profile_id = ? ORDER BY updated_at DESC`)
    .all(user.owner_profile_id);
  const dbProjects = dbRows.map((r) => ({
    ...rowToPublicProperty(db, r),
    status: r.status,
    hidden: Boolean(r.hidden),
  }));
  const activity = db
    .prepare(
      `SELECT id, action, detail, created_at AS createdAt FROM owner_activity_log WHERE owner_profile_id = ? ORDER BY created_at DESC LIMIT 40`,
    )
    .all(user.owner_profile_id);
  return {
    user,
    profile,
    publicOwner: profileToPublicOwner(profile),
    seedProjects,
    memberProjects: dbProjects,
    documents: listMemberDocuments(db),
    activity,
  };
}

export function patchMemberByAdmin(db, adminUser, userId, body) {
  rejectMemberEscalation(body);
  const user = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'REAL_ESTATE_OWNER'`).get(userId);
  if (!user) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  if (body.status !== undefined) {
    if (!["ACTIVE", "DISABLED"].includes(body.status)) {
      const err = new Error("Invalid status");
      err.status = 400;
      throw err;
    }
    db.prepare(`UPDATE users SET status = ?, updated_at = ? WHERE id = ?`).run(
      body.status,
      new Date().toISOString(),
      userId,
    );
    logAdminAction(db, {
      adminUserId: adminUser.id,
      action: body.status === "ACTIVE" ? "member_activated" : "member_suspended",
      targetType: "user",
      targetId: userId,
    });
  }
  if (body.password && String(body.password).length >= 8) {
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).run(
      hashPassword(body.password),
      new Date().toISOString(),
      userId,
    );
    logAdminAction(db, {
      adminUserId: adminUser.id,
      action: "member_password_reset",
      targetType: "user",
      targetId: userId,
    });
  }
  if (body.name !== undefined || body.phone !== undefined || body.email !== undefined) {
    const sets = [];
    const vals = [];
    if (body.name !== undefined) {
      sets.push("name = ?");
      vals.push(String(body.name).trim().slice(0, 200));
    }
    if (body.phone !== undefined) {
      sets.push("phone = ?");
      vals.push(body.phone ? String(body.phone).slice(0, 32) : null);
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (findUserByEmail(db, email) && findUserByEmail(db, email).id !== userId) {
        const err = new Error("Email already in use");
        err.status = 409;
        throw err;
      }
      sets.push("email = ?");
      vals.push(email);
    }
    if (sets.length) {
      sets.push("updated_at = ?");
      vals.push(new Date().toISOString(), userId);
      db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    }
  }
  if (user.owner_profile_id && body.profile) {
    updateMemberProfile(db, user.owner_profile_id, body.profile);
    logAdminAction(db, {
      adminUserId: adminUser.id,
      action: "member_profile_updated",
      targetType: "member_profile",
      targetId: user.owner_profile_id,
    });
  }
  return getMemberDetailForAdmin(db, userId);
}
