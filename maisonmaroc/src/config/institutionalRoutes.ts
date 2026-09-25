/** Public institutional pages (association site chrome: HomeFooter, no marketplace mobile nav). */
const INSTITUTIONAL_PREFIXES = [
  "/a-propos",
  "/actualites",
  "/membres",
  "/projets",
  "/evenements",
  "/documents",
  "/contact",
  "/faq",
  "/legal/",
  "/403",
  "/429",
] as const;

export function isInstitutionalPath(pathname: string): boolean {
  if (pathname === "/") return false;
  return INSTITUTIONAL_PREFIXES.some(
    (p) => pathname === p.replace(/\/$/, "") || (p.endsWith("/") && pathname.startsWith(p)),
  );
}

const MARKETPLACE_PREFIXES = [
  "/search",
  "/property/",
  "/agent/",
  "/favorites",
  "/publish",
  "/login",
  "/register",
  "/client/",
  "/owner/",
  "/admin",
] as const;

/** Association chrome (HomeFooter, no bottom marketplace nav) for public APIO pages and unknown routes. */
export function usesInstitutionalChrome(pathname: string): boolean {
  if (pathname === "/") return false;
  if (isInstitutionalPath(pathname)) return true;
  return !MARKETPLACE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}
