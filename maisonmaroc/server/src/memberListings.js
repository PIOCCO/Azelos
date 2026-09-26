import { cityCoords } from "./cityCoords.js";
import { getMemberProfileById, profileToPublicOwner } from "./memberProfiles.js";

function slugifyTitle(title) {
  return String(title || "projet")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function ensureProjectSlug(db, row) {
  if (row.slug) return row.slug;
  const base = slugifyTitle(row.title_fr || row.title_ar || row.id);
  let slug = `${base}-${row.id.slice(0, 8)}`;
  const clash = db.prepare(`SELECT 1 FROM owner_project_drafts WHERE slug = ? AND id != ?`).get(slug, row.id);
  if (clash) slug = `${base}-${row.id.slice(0, 12)}`;
  db.prepare(`UPDATE owner_project_drafts SET slug = ? WHERE id = ?`).run(slug, row.id);
  return slug;
}

export function listProjectImages(db, projectId) {
  return db
    .prepare(`SELECT * FROM owner_project_images WHERE project_id = ? ORDER BY is_primary DESC, sort_order ASC, created_at ASC`)
    .all(projectId);
}

export function rowToPublicProperty(db, row) {
  const slug = row.slug || ensureProjectSlug(db, row);
  const images = listProjectImages(db, row.id);
  const imageUrls = images.map((img) => `/api/listings/project-images/${img.id}/file`);
  const cityId = row.city_id || "oujda";
  const coords = cityCoords[cityId] || cityCoords.oujda;
  let amenities = [];
  try {
    amenities = JSON.parse(row.amenities_json || "[]");
  } catch {
    amenities = [];
  }
  return {
    id: row.id,
    slug,
    title: { fr: row.title_fr, ar: row.title_ar },
    type: row.property_type || "apartment",
    transaction: row.listing_transaction || "sale",
    price: Number(row.price) || 0,
    cityId,
    neighborhood: { fr: row.neighborhood_fr || "", ar: row.neighborhood_ar || "" },
    surface: Number(row.surface) || 0,
    bedrooms: Number(row.bedrooms) || 0,
    bathrooms: Number(row.bathrooms) || 1,
    furnished: Boolean(row.furnished),
    amenities,
    description: { fr: row.description_fr, ar: row.description_ar },
    images: imageUrls,
    publishedDate: (row.published_at || row.updated_at || row.created_at || "").slice(0, 10),
    verified: false,
    ownerId: row.owner_profile_id,
    featured: false,
    lat: row.lat ?? coords.lat,
    lng: row.lng ?? coords.lng,
    memberProject: true,
    hidden: Boolean(row.hidden),
  };
}

export function listPublishedMemberProperties(db) {
  const rows = db
    .prepare(
      `SELECT * FROM owner_project_drafts
       WHERE status = 'published' AND (hidden IS NULL OR hidden = 0)
       ORDER BY published_at DESC, updated_at DESC`,
    )
    .all();
  return rows.map((r) => rowToPublicProperty(db, r));
}

export function getPublishedMemberProperty(db, slugOrId) {
  const row =
    db.prepare(`SELECT * FROM owner_project_drafts WHERE (slug = ? OR id = ?) AND status = 'published'`).get(slugOrId, slugOrId) ||
    null;
  if (!row || row.hidden) return null;
  return rowToPublicProperty(db, row);
}

export function getPublicProjectImage(db, imageId) {
  const row = db
    .prepare(
      `SELECT i.*, p.status, p.hidden FROM owner_project_images i
       JOIN owner_project_drafts p ON p.id = i.project_id WHERE i.id = ?`,
    )
    .get(imageId);
  if (!row || row.status !== "published" || row.hidden) return null;
  return { storageName: row.storage_name, mime: row.mime };
}

export function generateSlugForPublish(db, row) {
  return ensureProjectSlug(db, row);
}
