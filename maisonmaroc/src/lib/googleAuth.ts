import { apiFetch } from "./api";
import type { ApiUser } from "./api";

export function resolveGoogleClientId(apiClientId: string | null | undefined) {
  const fromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (fromEnv) return fromEnv;
  if (apiClientId) return apiClientId;
  return "";
}

export async function signInWithGoogleIdToken(idToken: string) {
  return apiFetch<{ user: ApiUser }>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}
