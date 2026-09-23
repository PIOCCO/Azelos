/** Vite `base` without trailing slash; empty string means site root. */
export function appBasename(): string | undefined {
  const raw = import.meta.env.BASE_URL ?? "/";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.length ? trimmed : undefined;
}

/** Prefix for static assets when not using React Router `Link`. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (base === "/") return normalized;
  return `${base.replace(/\/+$/, "")}${normalized}`;
}
