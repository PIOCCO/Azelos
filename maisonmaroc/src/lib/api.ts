import { appBasename } from "./appBase";

/**
 * Production under https://dribex.ma/APIO: returns `/APIO` so requests hit `/APIO/api/…`
 * (proxied to the APIO backend without conflicting with Dribex `/api`).
 * Override with VITE_API_URL when the API is on another origin.
 */
export function apiRoot(): string {
  const explicit = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const base = appBasename();
  return base || "";
}

/** Resolve API-hosted media paths (e.g. member avatars) for use in img src. */
export function apiMediaUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("//") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${apiRoot()}${url}`;
}

/** Set when fetch fails (API not running or wrong VITE_API_URL). */
let apiUnreachable = false;

export function isApiUnreachable() {
  return apiUnreachable;
}

export function resetApiReachability() {
  apiUnreachable = false;
}

export type UserRole = "SUPER_ADMIN" | "REAL_ESTATE_OWNER" | "CLIENT";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  status: "ACTIVE" | "DISABLED";
  authProvider: string;
  ownerProfileId?: string | null;
  createdAt?: string;
}

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data?: T; error?: string; status: number }> {
  const root = apiRoot();
  if (apiUnreachable && !root && typeof window === "undefined") {
    return { error: "Network error", status: 0 };
  }
  try {
    const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
    const res = await fetch(`${root}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(init.headers || {}),
      },
    });
    apiUnreachable = false;
    const body = await parseJson(res);
    if (!res.ok) {
      const err =
        (body && typeof body.error === "string" && body.error) ||
        `Request failed (${res.status})`;
      if (res.status === 429 && typeof window !== "undefined") {
        const on429 = (body as { code?: string })?.code === "RATE_LIMIT";
        if (on429 && !window.location.pathname.endsWith("/429")) {
          const base = appBasename() || "";
          window.location.assign(`${base}/429`);
        }
      }
      return { error: err, status: res.status };
    }
    return { data: body as T, status: res.status };
  } catch {
    apiUnreachable = true;
    return { error: "Network error", status: 0 };
  }
}

export function googleOAuthStartUrl(returnPath?: string) {
  const params = new URLSearchParams();
  if (returnPath && returnPath.startsWith("/") && !returnPath.startsWith("//")) {
    params.set("next", returnPath.slice(0, 512));
  }
  const qs = params.toString();
  const path = `/api/auth/google${qs ? `?${qs}` : ""}`;
  const root = apiRoot();
  if (root) return `${root}${path}`;
  if (typeof window !== "undefined") {
    const base = appBasename() || "";
    return `${window.location.origin}${base}${path}`;
  }
  return path;
}

export function dashboardPathForRole(role: UserRole | undefined) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/";
    case "REAL_ESTATE_OWNER":
      return "/owner";
    case "CLIENT":
      return "/";
    default:
      return "/";
  }
}
