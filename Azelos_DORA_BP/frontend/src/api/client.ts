import type { ApiErrorBody } from "./types";
import { notifyUnauthorized } from "./authHandler";

export class ApiError extends Error {
  status: number;
  code?: string;
  body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.status = status;
    this.body = body;
    if (body?.error?.code) this.code = body.error.code;
  }
}

export function getApiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  return base ? base.replace(/\/$/, "") : "";
}

export type TokenProvider = () => string | null;

let tokenProvider: TokenProvider = () => null;

export function setTokenProvider(fn: TokenProvider) {
  tokenProvider = fn;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = tokenProvider();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  let body: ApiErrorBody | undefined;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text) as ApiErrorBody;
    } catch {
      body = { detail: text };
    }
  }

  if (!res.ok) {
    const msg =
      body?.error?.message ??
      (typeof body?.detail === "string" ? body.detail : res.statusText);
    const err = new ApiError(res.status, msg || "Request failed", body);
    if (res.status === 401) notifyUnauthorized();
    throw err;
  }

  return (text ? JSON.parse(text) : {}) as T;
}
