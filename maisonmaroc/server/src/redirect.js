import { parseOrigins } from "./middleware.js";

/** Build a redirect URL under FRONTEND_URL (include SPA base path, e.g. https://dribex.ma/APIO). */
export function frontendRedirect(pathAndQuery) {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  const fallbackOrigin = "http://localhost:5173";
  const configured = (process.env.FRONTEND_URL || fallbackOrigin).replace(/\/+$/, "");
  const href = `${configured}${path}`;
  try {
    const target = new URL(href);
    const allowed = new Set(parseOrigins().map(originOf));
    if (allowed.has(target.origin)) return target.href;
  } catch {
    /* ignore */
  }
  return `${fallbackOrigin}${path}`;
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}
