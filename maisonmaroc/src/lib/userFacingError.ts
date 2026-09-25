import type { TFunction } from "i18next";

/** Maps API / network failures to safe French messages (never raw server text). */
export function userFacingApiError(
  t: TFunction,
  opts: { status: number; raw?: string },
): string {
  if (opts.status === 429) return t("inst.contact.rateLimit");
  if (opts.status === 401 || opts.status === 403) return t("inst.errors.forbidden");
  if (opts.status === 404) return t("inst.errors.notFound");
  if (opts.status === 0) return t("inst.errors.network");
  if (opts.status >= 500) return t("inst.errors.server");
  return t("inst.errors.generic");
}
