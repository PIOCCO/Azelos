/**
 * Auth cookie Path — scope APIO sessions under the public SPA prefix (e.g. /APIO)
 * so apio_token is not sent to Dribex routes on the same host.
 */
export function resolveAuthCookiePath() {
  const explicit = process.env.COOKIE_PATH?.trim();
  if (explicit) {
    return explicit.startsWith("/") ? explicit : `/${explicit}`;
  }
  const base = process.env.FRONTEND_URL?.trim();
  if (!base) return "/";
  try {
    const pathname = new URL(base).pathname.replace(/\/+$/, "");
    if (pathname && pathname !== "/") {
      return pathname.startsWith("/") ? pathname : `/${pathname}`;
    }
  } catch {
    /* ignore invalid FRONTEND_URL */
  }
  return "/";
}
