import { randomUUID } from "node:crypto";
import { getOwnerProfileById as getSeedOwnerProfileById } from "./ownersCatalog.js";

function slugify(input) {
  return String(input || "membre")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function getMemberProfileById(db, ownerProfileId) {
  if (!ownerProfileId) return null;
  const row = db.prepare(`SELECT * FROM apio_member_profiles WHERE id = ?`).get(ownerProfileId);
  if (row) return rowToProfile(row);
  return getSeedOwnerProfileById(ownerProfileId);
}

export function rowToProfile(r) {
  return {
    id: r.id,
    name: { fr: r.name_fr || "", ar: r.name_ar || "" },
    agency: r.agency_fr || r.agency_ar ? { fr: r.agency_fr || "", ar: r.agency_ar || "" } : undefined,
    type: r.profile_type || "agency",
    avatar: r.avatar_url || "",
    verified: Boolean(r.verified),
    phone: r.phone || "",
    whatsapp: r.whatsapp || "",
    email: r.email || "",
    cityId: r.city_id || "",
    memberSince: r.member_since || r.created_at?.slice(0, 10) || "",
    bio: { fr: r.bio_fr || "", ar: r.bio_ar || "" },
    website: r.website || null,
    contactName: r.contact_name || null,
    contactPosition: r.contact_position || null,
    contactPhone: r.contact_phone || null,
    contactEmail: r.contact_email || null,
    source: "database",
  };
}

export function createMemberProfile(db, data) {
  const base = slugify(data.agencyFr || data.nameFr || "apio-member");
  let id = data.id ? String(data.id).slice(0, 64) : `${base}-${randomUUID().slice(0, 8)}`;
  if (getSeedOwnerProfileById(id) || db.prepare(`SELECT 1 FROM apio_member_profiles WHERE id = ?`).get(id)) {
    id = `${base}-${randomUUID().slice(0, 8)}`;
  }
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO apio_member_profiles (
      id, name_fr, name_ar, agency_fr, agency_ar, profile_type, city_id, phone, whatsapp, email,
      avatar_url, bio_fr, bio_ar, website, verified, member_since,
      contact_name, contact_position, contact_phone, contact_email, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    String(data.nameFr ?? "").slice(0, 200),
    String(data.nameAr ?? "").slice(0, 200),
    String(data.agencyFr ?? "").slice(0, 200),
    String(data.agencyAr ?? "").slice(0, 200),
    data.profileType ? String(data.profileType).slice(0, 32) : "agency",
    data.cityId ? String(data.cityId).slice(0, 64) : null,
    data.phone ? String(data.phone).slice(0, 32) : null,
    data.whatsapp ? String(data.whatsapp).slice(0, 32) : null,
    data.email ? String(data.email).slice(0, 254) : null,
    data.avatarUrl ? String(data.avatarUrl).slice(0, 2048) : null,
    String(data.bioFr ?? "").slice(0, 5000),
    String(data.bioAr ?? "").slice(0, 5000),
    data.website ? String(data.website).slice(0, 2048) : null,
    data.verified ? 1 : 0,
    data.memberSince || now.slice(0, 10),
    data.contactName ? String(data.contactName).slice(0, 200) : null,
    data.contactPosition ? String(data.contactPosition).slice(0, 120) : null,
    data.contactPhone ? String(data.contactPhone).slice(0, 32) : null,
    data.contactEmail ? String(data.contactEmail).slice(0, 254) : null,
    now,
    now,
  );
  return getMemberProfileById(db, id);
}

export function updateMemberProfile(db, ownerProfileId, data) {
  const existing = db.prepare(`SELECT id FROM apio_member_profiles WHERE id = ?`).get(ownerProfileId);
  if (!existing) return null;
  if (data.avatarUrl !== undefined) {
    const err = new Error("Profile image must be uploaded as a file");
    err.status = 400;
    throw err;
  }
  const fields = {
    name_fr: data.nameFr,
    name_ar: data.nameAr,
    agency_fr: data.agencyFr,
    agency_ar: data.agencyAr,
    profile_type: data.profileType,
    city_id: data.cityId,
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    bio_fr: data.bioFr,
    bio_ar: data.bioAr,
    website: data.website,
    verified: data.verified !== undefined ? (data.verified ? 1 : 0) : undefined,
    contact_name: data.contactName,
    contact_position: data.contactPosition,
    contact_phone: data.contactPhone,
    contact_email: data.contactEmail,
  };
  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) {
      sets.push(`${k} = ?`);
      vals.push(v);
    }
  }
  if (!sets.length) return getMemberProfileById(db, ownerProfileId);
  sets.push("updated_at = ?");
  vals.push(new Date().toISOString(), ownerProfileId);
  db.prepare(`UPDATE apio_member_profiles SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return getMemberProfileById(db, ownerProfileId);
}

export function profileToPublicOwner(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    type: profile.type || "agency",
    agency: profile.agency,
    avatar: profile.avatar || "",
    verified: Boolean(profile.verified),
    rating: 5,
    reviewsCount: 0,
    phone: profile.phone || "",
    whatsapp: profile.whatsapp || profile.phone || "",
    email: profile.email || "",
    cityId: profile.cityId || "oujda",
    memberSince: profile.memberSince || new Date().toISOString().slice(0, 10),
    responseTimeMinutes: 60,
    bio: profile.bio || { fr: "", ar: "" },
    languages: ["fr", "ar"],
  };
}
