import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "./auth.js";
import { getMemberProfileById } from "./memberProfiles.js";
import { generateSlugForPublish } from "./memberListings.js";
import { listPropertiesForOwnerProfile } from "./catalog.js";
import { listMemberDocuments, getMemberDocumentForDownload } from "./content.js";
import { unreadCountForUser } from "./messages.js";
import { validateExternalMediaUrl } from "./validateUrls.js";
import { deleteStoredFile } from "./uploads.js";
import {
  PRIVILEGED_PROFILE_OVERRIDE_FIELDS,
  PRIVILEGED_PROJECT_FIELDS,
  PRIVILEGED_USER_FIELDS,
  rejectForbiddenBodyFields,
} from "./securityFields.js";

const PROFILE_PATCH_KEYS = [
  "bioFr",
  "bioAr",
  "phone",
  "whatsapp",
  "emailPublic",
  "website",
  "avatarUrl",
];

const ME_PATCH_KEYS = ["name", "phone", "password"];

export function requireOwnerProfile(user) {
  const pid = user?.ownerProfileId;
  if (!pid) {
    const err = new Error("Member profile is not linked to an APIO directory entry");
    err.status = 400;
    throw err;
  }
  return pid;
}

export function logOwnerActivity(db, { ownerProfileId, userId, action, detail }) {
  db.prepare(
    `INSERT INTO owner_activity_log (id, owner_profile_id, user_id, action, detail) VALUES (?, ?, ?, ?, ?)`,
  ).run(randomUUID(), ownerProfileId, userId ?? null, action, detail ? String(detail).slice(0, 500) : null);
}

function getOverrides(db, ownerProfileId) {
  return db.prepare(`SELECT * FROM owner_profile_overrides WHERE owner_profile_id = ?`).get(ownerProfileId);
}

export function memberAvatarPublicUrl(ownerProfileId, cacheVersion) {
  const id = String(ownerProfileId || "").slice(0, 128);
  const base = `/api/public/member-avatars/${id}/file`;
  if (cacheVersion == null || cacheVersion === "") return base;
  return `${base}?v=${encodeURIComponent(String(cacheVersion))}`;
}

function avatarCacheVersion(overrides) {
  if (!overrides?.avatar_storage) return null;
  return overrides.updated_at || overrides.avatar_storage;
}

function resolveAvatar(seed, overrides, ownerProfileId) {
  if (overrides?.avatar_storage) {
    return memberAvatarPublicUrl(ownerProfileId, avatarCacheVersion(overrides));
  }
  if (overrides?.avatar_url) return overrides.avatar_url;
  return seed?.avatar || "";
}

function mergePublicProfile(seed, overrides) {
  if (!seed) return null;
  const o = overrides || {};
  const ownerProfileId = seed.id;
  return {
    id: seed.id,
    name: seed.name,
    agency: seed.agency,
    type: seed.type,
    cityId: seed.cityId,
    memberSince: seed.memberSince,
    verified: seed.verified,
    avatar: resolveAvatar(seed, o, ownerProfileId),
    phone: o.phone || seed.phone,
    whatsapp: o.whatsapp || seed.whatsapp,
    email: o.email_public || seed.email,
    website: o.website || null,
    bio: {
      fr: o.bio_fr ?? seed.bio?.fr ?? "",
      ar: o.bio_ar ?? seed.bio?.ar ?? "",
    },
  };
}

export function computeProfileCompletion(publicProfile, user) {
  const checks = [
    { key: "avatar", ok: Boolean(publicProfile?.avatar), labelFr: "Logo / photo", labelAr: "الشعار / الصورة" },
    { key: "bio", ok: Boolean(publicProfile?.bio?.fr?.trim() || publicProfile?.bio?.ar?.trim()), labelFr: "Description", labelAr: "الوصف" },
    { key: "phone", ok: Boolean(publicProfile?.phone?.trim()), labelFr: "Téléphone", labelAr: "الهاتف" },
    { key: "email", ok: Boolean(publicProfile?.email?.trim()), labelFr: "E-mail professionnel", labelAr: "البريد المهني" },
    { key: "account", ok: Boolean(user?.name?.trim() && user?.email?.trim()), labelFr: "Compte utilisateur", labelAr: "حساب المستخدم" },
  ];
  const done = checks.filter((c) => c.ok).length;
  const percent = Math.round((done / checks.length) * 100);
  return { percent, missing: checks.filter((c) => !c.ok) };
}

export function getOwnerDashboard(db, user) {
  const ownerProfileId = requireOwnerProfile(user);
  const seed = getMemberProfileById(db, ownerProfileId);
  const overrides = getOverrides(db, ownerProfileId);
  const publicProfile = mergePublicProfile(seed, overrides);
  const completion = computeProfileCompletion(publicProfile, user);

  const catalogProjects = listPropertiesForOwnerProfile(ownerProfileId);
  const drafts = db
    .prepare(`SELECT status FROM owner_project_drafts WHERE owner_profile_id = ?`)
    .all(ownerProfileId);
  const draftPending = drafts.filter((d) => d.status === "pending").length;
  const draftDraft = drafts.filter((d) => d.status === "draft").length;

  const documents = listMemberDocuments(db);
  const unreadMessages = unreadCountForUser(db, user);

  return {
    welcomeName: publicProfile?.agency?.fr || publicProfile?.name?.fr || user.name,
    stats: {
      profileCompletion: completion.percent,
      catalogProjects: catalogProjects.length,
      draftProjects: drafts.length,
      pendingProjects: draftPending,
      draftOnly: draftDraft,
      memberDocuments: documents.length,
      unreadMessages,
    },
    profileCompletion: completion,
  };
}

export function getOwnerProfileBundle(db, user) {
  const ownerProfileId = requireOwnerProfile(user);
  const seed = getMemberProfileById(db, ownerProfileId);
  if (!seed) {
    const err = new Error("Unknown member profile id");
    err.status = 404;
    throw err;
  }
  const overrides = getOverrides(db, ownerProfileId);
  const publicProfile = mergePublicProfile(seed, overrides);
  const completion = computeProfileCompletion(publicProfile, user);
  return {
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      status: user.status,
      ownerProfileId,
    },
    publicProfile,
    seedLocked: {
      name: seed.name,
      agency: seed.agency,
      type: seed.type,
      cityId: seed.cityId,
      memberSince: seed.memberSince,
      verified: seed.verified,
    },
    overrides: overrides
      ? {
          bioFr: overrides.bio_fr,
          bioAr: overrides.bio_ar,
          phone: overrides.phone,
          whatsapp: overrides.whatsapp,
          emailPublic: overrides.email_public,
          website: overrides.website,
          avatarUrl: overrides.avatar_url,
        }
      : null,
    profileCompletion: completion,
    publicProfilePath: `/agent/${ownerProfileId}`,
  };
}

export function patchOwnerProfile(db, user, body) {
  rejectForbiddenBodyFields(body, PRIVILEGED_PROFILE_OVERRIDE_FIELDS);
  const ownerProfileId = requireOwnerProfile(user);
  if (!getMemberProfileById(db, ownerProfileId)) {
    const err = new Error("Unknown member profile id");
    err.status = 404;
    throw err;
  }
  const data = {};
  if (body.bioFr !== undefined) data.bio_fr = String(body.bioFr).slice(0, 5000);
  if (body.bioAr !== undefined) data.bio_ar = String(body.bioAr).slice(0, 5000);
  if (body.phone !== undefined) data.phone = String(body.phone).slice(0, 32);
  if (body.whatsapp !== undefined) data.whatsapp = String(body.whatsapp).slice(0, 32);
  if (body.emailPublic !== undefined) data.email_public = String(body.emailPublic).slice(0, 254);
  if (body.website !== undefined) {
    const w = body.website ? String(body.website).trim() : "";
    if (w) {
      const check = validateExternalMediaUrl(w);
      if (!check.ok) {
        const err = new Error(check.error || "Invalid website URL");
        err.status = 400;
        throw err;
      }
      data.website = check.value;
    } else data.website = null;
  }
  if (body.avatarUrl !== undefined) {
    const a = body.avatarUrl ? String(body.avatarUrl).trim() : "";
    if (a) {
      const check = validateExternalMediaUrl(a);
      if (!check.ok) {
        const err = new Error(check.error || "Invalid avatar URL");
        err.status = 400;
        throw err;
      }
      data.avatar_url = check.value;
    } else data.avatar_url = null;
    data.avatar_storage = null;
    data.avatar_mime = null;
  }

  const keys = Object.keys(data);
  if (!keys.length) return getOwnerProfileBundle(db, user);

  const existing = getOverrides(db, ownerProfileId);
  let removeStorage = null;
  if (data.avatar_storage === null && existing?.avatar_storage) {
    removeStorage = existing.avatar_storage;
  }
  const now = new Date().toISOString();
  if (!existing) {
    db.prepare(
      `INSERT INTO owner_profile_overrides (owner_profile_id, bio_fr, bio_ar, phone, whatsapp, email_public, website, avatar_url, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      ownerProfileId,
      data.bio_fr ?? null,
      data.bio_ar ?? null,
      data.phone ?? null,
      data.whatsapp ?? null,
      data.email_public ?? null,
      data.website ?? null,
      data.avatar_url ?? null,
      now,
    );
  } else {
    const sets = keys.map((k) => `${k} = ?`).join(", ");
    db.prepare(
      `UPDATE owner_profile_overrides SET ${sets}, updated_at = ? WHERE owner_profile_id = ?`,
    ).run(...keys.map((k) => data[k]), now, ownerProfileId);
  }
  if (removeStorage) deleteStoredFile(removeStorage);
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "profile_updated" });
  return getOwnerProfileBundle(db, user);
}

function deleteStoredAvatar(db, ownerProfileId) {
  const o = getOverrides(db, ownerProfileId);
  if (!o?.avatar_storage) return null;
  const name = o.avatar_storage;
  db.prepare(
    `UPDATE owner_profile_overrides SET avatar_storage = NULL, avatar_mime = NULL, avatar_url = NULL, updated_at = ? WHERE owner_profile_id = ?`,
  ).run(new Date().toISOString(), ownerProfileId);
  return name;
}

export function uploadOwnerProfileAvatar(db, user, stored) {
  const ownerProfileId = requireOwnerProfile(user);
  if (!getMemberProfileById(db, ownerProfileId)) {
    const err = new Error("Unknown member profile id");
    err.status = 404;
    throw err;
  }
  const existing = getOverrides(db, ownerProfileId);
  const oldStorage = existing?.avatar_storage;
  const now = new Date().toISOString();
  const publicUrl = memberAvatarPublicUrl(ownerProfileId, now);
  if (!existing) {
    db.prepare(
      `INSERT INTO owner_profile_overrides (owner_profile_id, avatar_url, avatar_storage, avatar_mime, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(ownerProfileId, publicUrl, stored.storageName, stored.mime, now);
  } else {
    db.prepare(
      `UPDATE owner_profile_overrides SET avatar_url = ?, avatar_storage = ?, avatar_mime = ?, updated_at = ? WHERE owner_profile_id = ?`,
    ).run(publicUrl, stored.storageName, stored.mime, now, ownerProfileId);
  }
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "profile_avatar_uploaded" });
  return { oldStorage, bundle: getOwnerProfileBundle(db, user) };
}

export function removeOwnerProfileAvatar(db, user) {
  const ownerProfileId = requireOwnerProfile(user);
  const oldStorage = deleteStoredAvatar(db, ownerProfileId);
  if (oldStorage) {
    logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "profile_avatar_removed" });
  }
  return { oldStorage, bundle: getOwnerProfileBundle(db, user) };
}

export function getPublicMemberProfile(db, ownerProfileId) {
  const seed = getMemberProfileById(db, ownerProfileId);
  if (!seed) return null;
  const overrides = getOverrides(db, ownerProfileId);
  return mergePublicProfile(seed, overrides);
}

export function getPublicMemberAvatarFile(db, ownerProfileId) {
  const o = getOverrides(db, ownerProfileId);
  if (!o?.avatar_storage) return null;
  return { storageName: o.avatar_storage, mime: o.avatar_mime || "image/jpeg" };
}

export function patchOwnerMe(db, user, body) {
  rejectPrivilegedFields(body);
  const ownerProfileId = requireOwnerProfile(user);
  const updates = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || name.length > 200) {
      const err = new Error("Invalid name");
      err.status = 400;
      throw err;
    }
    updates.name = name;
  }
  if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).slice(0, 32) : null;
  if (body.password !== undefined) {
    const p = String(body.password);
    if (p.length < 8) {
      const err = new Error("Password must be at least 8 characters");
      err.status = 400;
      throw err;
    }
    updates.password_hash = hashPassword(p);
  }
  const keys = Object.keys(updates);
  if (!keys.length) return user;
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  db.prepare(`UPDATE users SET ${sets}, updated_at = ? WHERE id = ? AND role = 'REAL_ESTATE_OWNER'`).run(
    ...keys.map((k) => updates[k]),
    new Date().toISOString(),
    user.id,
  );
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "account_updated" });
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id);
}

function rejectPrivilegedFields(body) {
  rejectForbiddenBodyFields(body, PRIVILEGED_USER_FIELDS);
}

export function listOwnerProjects(db, user, { q = "", status = "" } = {}) {
  const ownerProfileId = requireOwnerProfile(user);
  const catalog = listPropertiesForOwnerProfile(ownerProfileId).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    source: "catalog",
    status: "published",
    cityId: null,
    updatedAt: null,
  }));
  let drafts = db
    .prepare(`SELECT * FROM owner_project_drafts WHERE owner_profile_id = ? ORDER BY updated_at DESC`)
    .all(ownerProfileId)
    .map(rowToDraft);

  if (status) drafts = drafts.filter((d) => d.status === status);
  if (q) {
    const qq = q.toLowerCase();
    drafts = drafts.filter(
      (d) => d.title.fr.toLowerCase().includes(qq) || d.title.ar.includes(q) || d.id.includes(qq),
    );
  }

  return { catalog, drafts };
}

function rowToDraft(r) {
  return {
    id: r.id,
    slug: r.slug || null,
    title: { fr: r.title_fr, ar: r.title_ar },
    description: { fr: r.description_fr, ar: r.description_ar },
    cityId: r.city_id,
    status: r.status,
    source: "draft",
    transaction: r.listing_transaction || "sale",
    propertyType: r.property_type || "apartment",
    price: Number(r.price) || 0,
    surface: Number(r.surface) || 0,
    bedrooms: Number(r.bedrooms) || 0,
    bathrooms: Number(r.bathrooms) || 1,
    furnished: Boolean(r.furnished),
    neighborhood: { fr: r.neighborhood_fr || "", ar: r.neighborhood_ar || "" },
    updatedAt: r.updated_at,
    createdAt: r.created_at,
    publishedAt: r.published_at,
  };
}

function pickListingFields(body, row) {
  const amenities =
    body.amenities !== undefined
      ? JSON.stringify(Array.isArray(body.amenities) ? body.amenities.slice(0, 20) : [])
      : row?.amenities_json;
  return {
    listing_transaction:
      body.transaction !== undefined ? String(body.transaction).slice(0, 16) : row?.listing_transaction,
    property_type: body.propertyType !== undefined ? String(body.propertyType).slice(0, 32) : row?.property_type,
    price: body.price !== undefined ? Math.max(0, Number(body.price) || 0) : row?.price,
    surface: body.surface !== undefined ? Math.max(0, Number(body.surface) || 0) : row?.surface,
    bedrooms: body.bedrooms !== undefined ? Math.max(0, Number(body.bedrooms) || 0) : row?.bedrooms,
    bathrooms: body.bathrooms !== undefined ? Math.max(1, Number(body.bathrooms) || 1) : row?.bathrooms,
    furnished: body.furnished !== undefined ? (body.furnished ? 1 : 0) : row?.furnished,
    neighborhood_fr:
      body.neighborhoodFr !== undefined ? String(body.neighborhoodFr).slice(0, 200) : row?.neighborhood_fr,
    neighborhood_ar:
      body.neighborhoodAr !== undefined ? String(body.neighborhoodAr).slice(0, 200) : row?.neighborhood_ar,
    amenities_json: amenities,
  };
}

function applyPublish(db, row, nextStatus) {
  if (nextStatus !== "published") return { published_at: row.published_at || null, slug: row.slug || null };
  const slug = generateSlugForPublish(db, row);
  const published_at = row.published_at || new Date().toISOString();
  return { published_at, slug };
}

export function getOwnerProject(db, user, projectId) {
  const ownerProfileId = requireOwnerProfile(user);
  const row = db.prepare(`SELECT * FROM owner_project_drafts WHERE id = ?`).get(projectId);
  if (!row || row.owner_profile_id !== ownerProfileId) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  const images = listProjectImages(db, projectId);
  return { project: rowToDraft(row), images };
}

function rejectPrivilegedProjectFields(body) {
  rejectForbiddenBodyFields(body, PRIVILEGED_PROJECT_FIELDS);
}

export function createOwnerProject(db, user, body) {
  rejectPrivilegedProjectFields(body);
  const ownerProfileId = requireOwnerProfile(user);
  const id = randomUUID();
  const now = new Date().toISOString();
  const titleFr = String(body.titleFr ?? "").trim();
  const titleAr = String(body.titleAr ?? "").trim();
  if (!titleFr && !titleAr) {
    const err = new Error("Project title is required");
    err.status = 400;
    throw err;
  }
  const listing = pickListingFields(body, null);
  const initialStatus = body.publish ? "published" : "draft";
  if (initialStatus === "published" && !body.cityId) {
    const err = new Error("City is required to publish");
    err.status = 400;
    throw err;
  }
  db.prepare(
    `INSERT INTO owner_project_drafts (
      id, owner_profile_id, title_fr, title_ar, description_fr, description_ar, city_id, status,
      listing_transaction, property_type, price, surface, bedrooms, bathrooms, furnished,
      amenities_json, neighborhood_fr, neighborhood_ar, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    ownerProfileId,
    titleFr.slice(0, 500),
    titleAr.slice(0, 500),
    String(body.descriptionFr ?? "").slice(0, 10000),
    String(body.descriptionAr ?? "").slice(0, 10000),
    body.cityId ? String(body.cityId).slice(0, 64) : null,
    initialStatus,
    listing.listing_transaction || "sale",
    listing.property_type || "apartment",
    listing.price ?? 0,
    listing.surface ?? 0,
    listing.bedrooms ?? 0,
    listing.bathrooms ?? 1,
    listing.furnished ?? 0,
    listing.amenities_json || "[]",
    listing.neighborhood_fr || "",
    listing.neighborhood_ar || "",
    now,
    now,
  );
  if (initialStatus === "published") {
    const row = db.prepare(`SELECT * FROM owner_project_drafts WHERE id = ?`).get(id);
    const pub = applyPublish(db, row, "published");
    db.prepare(`UPDATE owner_project_drafts SET slug = ?, published_at = ? WHERE id = ?`).run(pub.slug, pub.published_at, id);
    logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "project_published", detail: id });
  }
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "project_created", detail: id });
  return getOwnerProject(db, user, id);
}

export function updateOwnerProject(db, user, projectId, body) {
  rejectPrivilegedProjectFields(body);
  const ownerProfileId = requireOwnerProfile(user);
  const row = db.prepare(`SELECT * FROM owner_project_drafts WHERE id = ?`).get(projectId);
  if (!row || row.owner_profile_id !== ownerProfileId) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  let nextStatus = body.status !== undefined ? String(body.status) : row.status;
  if (body.publish === true) nextStatus = "published";
  const allowedStatus = new Set(["draft", "published", "archived"]);
  if (!allowedStatus.has(nextStatus)) {
    const err = new Error("Invalid status");
    err.status = 400;
    throw err;
  }
  const cityId =
    body.cityId !== undefined ? (body.cityId ? String(body.cityId).slice(0, 64) : null) : row.city_id;
  if (nextStatus === "published" && !cityId) {
    const err = new Error("City is required to publish");
    err.status = 400;
    throw err;
  }
  const listing = pickListingFields(body, row);
  const now = new Date().toISOString();
  const mergedRow = { ...row, ...listing, city_id: cityId, status: nextStatus };
  const pub = applyPublish(db, mergedRow, nextStatus);
  db.prepare(
    `UPDATE owner_project_drafts SET title_fr=?, title_ar=?, description_fr=?, description_ar=?, city_id=?, status=?,
     listing_transaction=?, property_type=?, price=?, surface=?, bedrooms=?, bathrooms=?, furnished=?,
     amenities_json=?, neighborhood_fr=?, neighborhood_ar=?, slug=?, published_at=?, updated_at=? WHERE id=?`,
  ).run(
    body.titleFr !== undefined ? String(body.titleFr).slice(0, 500) : row.title_fr,
    body.titleAr !== undefined ? String(body.titleAr).slice(0, 500) : row.title_ar,
    body.descriptionFr !== undefined ? String(body.descriptionFr).slice(0, 10000) : row.description_fr,
    body.descriptionAr !== undefined ? String(body.descriptionAr).slice(0, 10000) : row.description_ar,
    cityId,
    nextStatus,
    listing.listing_transaction || row.listing_transaction || "sale",
    listing.property_type || row.property_type || "apartment",
    listing.price ?? row.price ?? 0,
    listing.surface ?? row.surface ?? 0,
    listing.bedrooms ?? row.bedrooms ?? 0,
    listing.bathrooms ?? row.bathrooms ?? 1,
    listing.furnished ?? row.furnished ?? 0,
    listing.amenities_json || row.amenities_json || "[]",
    listing.neighborhood_fr ?? row.neighborhood_fr ?? "",
    listing.neighborhood_ar ?? row.neighborhood_ar ?? "",
    pub.slug || row.slug,
    pub.published_at,
    now,
    projectId,
  );
  if (nextStatus === "published" && row.status !== "published") {
    logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "project_published", detail: projectId });
  }
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "project_updated", detail: projectId });
  return getOwnerProject(db, user, projectId);
}

export function deleteOwnerProject(db, user, projectId) {
  const ownerProfileId = requireOwnerProfile(user);
  const row = db.prepare(`SELECT * FROM owner_project_drafts WHERE id = ?`).get(projectId);
  if (!row || row.owner_profile_id !== ownerProfileId) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  db.prepare(`DELETE FROM owner_project_drafts WHERE id = ?`).run(projectId);
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "project_deleted", detail: projectId });
  return true;
}

function listProjectImages(db, projectId) {
  return db
    .prepare(`SELECT * FROM owner_project_images WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC`)
    .all(projectId)
    .map((r) => ({
      id: r.id,
      storageName: r.storage_name,
      mime: r.mime,
      sortOrder: r.sort_order,
      isPrimary: Boolean(r.is_primary),
      url: `/api/owner/project-images/${r.id}/file`,
    }));
}

export function assertProjectOwnership(db, user, projectId) {
  const ownerProfileId = requireOwnerProfile(user);
  const row = db.prepare(`SELECT owner_profile_id FROM owner_project_drafts WHERE id = ?`).get(projectId);
  if (!row || row.owner_profile_id !== ownerProfileId) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  return ownerProfileId;
}

export function addProjectImage(db, user, projectId, stored) {
  assertProjectOwnership(db, user, projectId);
  const ownerProfileId = requireOwnerProfile(user);
  const id = randomUUID();
  const count = db.prepare(`SELECT COUNT(*) AS c FROM owner_project_images WHERE project_id = ?`).get(projectId).c;
  db.prepare(
    `INSERT INTO owner_project_images (id, project_id, storage_name, mime, sort_order, is_primary) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, projectId, stored.storageName, stored.mime, count, count === 0 ? 1 : 0);
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "project_image_uploaded", detail: projectId });
  return listProjectImages(db, projectId);
}

export function reorderProjectImages(db, user, projectId, body) {
  assertProjectOwnership(db, user, projectId);
  const ownerProfileId = requireOwnerProfile(user);
  const order = body?.order;
  if (Array.isArray(order) && order.length) {
    const stmt = db.prepare(
      `UPDATE owner_project_images SET sort_order = ? WHERE id = ? AND project_id = ?`,
    );
    order.forEach((imageId, index) => {
      const id = String(imageId).slice(0, 36);
      stmt.run(index, id, projectId);
    });
  }
  if (body?.primaryId) {
    const primaryId = String(body.primaryId).slice(0, 36);
    const belongs = db
      .prepare(`SELECT 1 FROM owner_project_images WHERE id = ? AND project_id = ?`)
      .get(primaryId, projectId);
    if (!belongs) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }
    db.prepare(`UPDATE owner_project_images SET is_primary = 0 WHERE project_id = ?`).run(projectId);
    db.prepare(
      `UPDATE owner_project_images SET is_primary = 1 WHERE id = ? AND project_id = ?`,
    ).run(primaryId, projectId);
  }
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "project_images_updated", detail: projectId });
  return listProjectImages(db, projectId);
}

export function deleteProjectImage(db, user, imageId) {
  const ownerProfileId = requireOwnerProfile(user);
  const row = db
    .prepare(
      `SELECT i.*, p.owner_profile_id FROM owner_project_images i
       JOIN owner_project_drafts p ON p.id = i.project_id WHERE i.id = ?`,
    )
    .get(imageId);
  if (!row || row.owner_profile_id !== ownerProfileId) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  db.prepare(`DELETE FROM owner_project_images WHERE id = ?`).run(imageId);
  logOwnerActivity(db, { ownerProfileId, userId: user.id, action: "project_image_deleted", detail: imageId });
  return row.storage_name;
}

export function getProjectImageForDownload(db, user, imageId) {
  const ownerProfileId = requireOwnerProfile(user);
  const row = db
    .prepare(
      `SELECT i.storage_name, i.mime, p.owner_profile_id FROM owner_project_images i
       JOIN owner_project_drafts p ON p.id = i.project_id WHERE i.id = ?`,
    )
    .get(imageId);
  if (!row || row.owner_profile_id !== ownerProfileId) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  return { storageName: row.storage_name, mime: row.mime };
}

export function listOwnerActivity(db, user, limit = 30) {
  const ownerProfileId = requireOwnerProfile(user);
  return db
    .prepare(
      `SELECT id, action, detail, created_at AS createdAt FROM owner_activity_log
       WHERE owner_profile_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(ownerProfileId, Math.min(limit, 100));
}

export function listOwnerContactRequests(db, user) {
  return db
    .prepare(
      `SELECT id, subject, message, created_at AS createdAt FROM contact_submissions
       WHERE email = ? COLLATE NOCASE ORDER BY created_at DESC LIMIT 50`,
    )
    .all(user.email);
}

export { PROFILE_PATCH_KEYS, ME_PATCH_KEYS, rejectPrivilegedFields };
