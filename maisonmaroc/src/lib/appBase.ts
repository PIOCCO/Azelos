/** Known hosting folders (dribex.ma/apio, custom /AIPO, etc.). */
const SUBPATH_PREFIXES = ["apio", "AIPO", "APIO", "aipo"];

function runtimeSubpathBasename(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const parts = window.location.pathname.split("/").filter(Boolean);
  const first = parts[0];
  if (!first) return undefined;
  if (SUBPATH_PREFIXES.includes(first) || /^apio$/i.test(first)) {
    return `/${first}`;
  }
  return undefined;
}

/** React Router basename (no trailing slash). */
export function appBasename(): string | undefined {
  const raw = import.meta.env.BASE_URL ?? "/";
  if (raw === "./" || raw === "." || raw === "/") {
    return runtimeSubpathBasename();
  }
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.length ? trimmed : undefined;
}

/**
 * Absolute URL path for a file in `public/` (leading slash, includes subfolder when deployed).
 * Avoids `./file` which breaks on nested client routes like `/apio/search`.
 */
export function withBase(path: string): string {
  const file = path.startsWith("/") ? path.slice(1) : path;
  const configured = (import.meta.env.BASE_URL ?? "/").trim();

  if (
    configured !== "./" &&
    configured !== "." &&
    configured !== "/" &&
    configured !== ""
  ) {
    const prefix = configured.replace(/\/+$/, "");
    return `${prefix}/${file}`;
  }

  const runtime = runtimeSubpathBasename();
  if (runtime) {
    return `${runtime}/${file}`;
  }

  return `/${file}`;
}
