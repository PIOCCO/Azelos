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

/** Prefix for static assets when not using React Router `Link`. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const file = path.startsWith("/") ? path.slice(1) : path;

  if (base === "./" || base === ".") {
    return `./${file}`;
  }
  if (base === "/") {
    return `/${file}`;
  }
  return `${base.replace(/\/+$/, "")}/${file}`;
}
