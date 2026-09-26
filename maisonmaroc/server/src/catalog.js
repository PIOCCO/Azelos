import {
  getPublishedMemberProperty,
  listPublishedMemberProperties,
} from "./memberListings.js";

/** Published member projects only (no static seed catalog). */
export function listPublicProperties(db) {
  return listPublishedMemberProperties(db);
}

export function getPropertyBySlugOrId(db, slugOrId) {
  if (!slugOrId) return null;
  return getPublishedMemberProperty(db, slugOrId);
}

export function listPropertiesForOwnerProfile(db, ownerProfileId) {
  if (!ownerProfileId) return [];
  return listPublishedMemberProperties(db).filter((p) => p.ownerId === ownerProfileId);
}
