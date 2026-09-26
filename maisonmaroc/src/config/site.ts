/**
 * Public site URL for SEO (canonical, sitemap, Open Graph).
 * Set VITE_CANONICAL_ORIGIN at build time, e.g. https://www.apio.ma
 * Leave empty for relative URLs until production domain is confirmed.
 */
export const CANONICAL_ORIGIN = (import.meta.env.VITE_CANONICAL_ORIGIN as string | undefined)?.replace(
  /\/+$/,
  "",
) || "";

export const PUBLIC_ROUTES = [
  "/",
  "/a-propos",
  "/membres",
  "/projets",
  "/actualites",
  "/evenements",
  "/documents",
  "/contact",
  "/faq",
  "/legal/mentions-legales",
  "/legal/confidentialite",
  "/legal/cookies",
  "/legal/cgu",
  "/legal/conditions-utilisation",
] as const;
