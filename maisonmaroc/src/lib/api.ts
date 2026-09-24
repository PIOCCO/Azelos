const API_BASE = import.meta.env.VITE_API_URL ?? "";

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
  if (apiUnreachable && !API_BASE) {
    return { error: "Network error", status: 0 };
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    apiUnreachable = false;
    const body = await parseJson(res);
    if (!res.ok) {
      const err =
        (body && typeof body.error === "string" && body.error) ||
        `Request failed (${res.status})`;
      return { error: err, status: res.status };
    }
    return { data: body as T, status: res.status };
  } catch {
    apiUnreachable = true;
    return { error: "Network error", status: 0 };
  }
}

export function googleOAuthStartUrl() {
  const path = "/api/auth/google";
  if (API_BASE) return `${API_BASE.replace(/\/+$/, "")}${path}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export function dashboardPathForRole(role: UserRole | undefined) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "REAL_ESTATE_OWNER":
      return "/owner";
    case "CLIENT":
      return "/client/account";
    default:
      return "/";
  }
}
