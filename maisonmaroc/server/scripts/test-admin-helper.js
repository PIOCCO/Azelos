/** Helpers for Tailscale-only APIO Admin API (separate listener). */

export const ADMIN_BASE = process.env.APIO_ADMIN_API_BASE || "http://127.0.0.1:7217";
export const PUBLIC_BASE = process.env.API_BASE || "http://localhost:3001";

export async function adminReq(path, opts = {}) {
  const res = await fetch(`${ADMIN_BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, headers: res.headers };
}

export function adminCookieFrom(setCookie) {
  if (!setCookie) return "";
  const m = /apio_admin_token=([^;]+)/.exec(setCookie);
  return m ? `apio_admin_token=${m[1]}` : "";
}

export async function adminLogin(email, password) {
  const r = await adminReq("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { ...r, cookie: adminCookieFrom(r.headers.get("set-cookie")) };
}
