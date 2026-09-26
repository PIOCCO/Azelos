/** Reject request bodies that attempt to set privileged / server-owned fields. */
export function rejectForbiddenBodyFields(body, forbiddenKeys, message = "Field cannot be modified") {
  if (!body || typeof body !== "object") return;
  for (const k of forbiddenKeys) {
    if (body[k] !== undefined) {
      const err = new Error(message);
      err.status = 400;
      throw err;
    }
  }
}

export const PRIVILEGED_ESCALATION_FIELDS = [
  "role",
  "isAdmin",
  "approved",
  "permissions",
  "memberId",
  "userId",
  "createdBy",
];

/** Fields members must not self-assign via /api/owner/me or profile escalation attempts. */
export const PRIVILEGED_USER_FIELDS = [
  ...PRIVILEGED_ESCALATION_FIELDS,
  "status",
  "ownerProfileId",
  "owner_profile_id",
];

export const PRIVILEGED_PROJECT_FIELDS = [
  "role",
  "ownerProfileId",
  "owner_profile_id",
  "ownerId",
  "owner_id",
  "memberId",
  "userId",
  "createdBy",
  "isAdmin",
  "approved",
  "hidden",
  "permissions",
  "isPublished",
];

export const PRIVILEGED_PROFILE_OVERRIDE_FIELDS = [
  "avatar_storage",
  "avatar_mime",
  "avatarStorage",
  "avatarMime",
  "avatarUrl",
  "avatar_url",
  "logoUrl",
  "logo_url",
  ...PRIVILEGED_USER_FIELDS,
];

export const ADMIN_PROJECT_PATCH_FIELDS = ["hidden", "status"];
