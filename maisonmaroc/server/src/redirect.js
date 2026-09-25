import { parseOrigins } from "./middleware.js";

/** Build a redirect URL under FRONTEND_URL if its origin is allow-listed. */
export function frontendRedirect(pathAndQuery) {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  const fallback = `http://localhost:5173${path}`;
  const base = process.env.FRONTEND_URL || fallback.replace(path, "");
  try {
    const target = new URL(path, base);
    const allowed = new Set(parseOrigins().map(originOf));
    if (allowed.has(target.origin)) return target.href;
  } catch {
    /* ignore */
  }
  return fallback;
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}
