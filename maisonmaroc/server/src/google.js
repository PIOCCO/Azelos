import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";

const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

/** Safe in-app return path after OAuth (no open redirect). */
export function sanitizeOAuthReturnPath(raw) {
  const s = String(raw || "/").trim();
  if (!s.startsWith("/") || s.startsWith("//")) return "/";
  if (s.includes("://")) return "/";
  return s.slice(0, 512);
}

function client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    const err = new Error("Google OAuth is not configured");
    err.status = 503;
    throw err;
  }
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID);
}

export function isGoogleRedirectConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

export function createOAuthState(returnPath = "/") {
  const state = crypto.randomBytes(24).toString("hex");
  pendingStates.set(state, {
    exp: Date.now() + STATE_TTL_MS,
    returnTo: sanitizeOAuthReturnPath(returnPath),
  });
  pruneStates();
  return state;
}

export function consumeOAuthState(state) {
  if (!state || !pendingStates.has(state)) {
    const err = new Error("Invalid OAuth state");
    err.status = 400;
    throw err;
  }
  const entry = pendingStates.get(state);
  pendingStates.delete(state);
  if (!entry?.exp || entry.exp < Date.now()) {
    const err = new Error("Invalid OAuth state");
    err.status = 400;
    throw err;
  }
  return entry.returnTo || "/";
}

function pruneStates() {
  const now = Date.now();
  for (const [k, entry] of pendingStates) {
    if (!entry?.exp || entry.exp < now) pendingStates.delete(k);
  }
}

export function googleAuthUrl(state) {
  if (!isGoogleRedirectConfigured()) {
    const err = new Error("Google OAuth redirect is not configured");
    err.status = 503;
    throw err;
  }
  const oauth = client();
  return oauth.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email"],
    prompt: "select_account",
    state,
  });
}

export async function exchangeCodeForProfile(code) {
  const oauth = client();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.id_token) {
    const err = new Error("Invalid OAuth response");
    err.status = 401;
    throw err;
  }
  return verifyIdToken(tokens.id_token);
}

export async function verifyIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error("Google OAuth is not configured");
    err.status = 503;
    throw err;
  }
  const oauth = new OAuth2Client(clientId);
  const ticket = await oauth.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    const err = new Error("Invalid Google token");
    err.status = 401;
    throw err;
  }
  if (payload.email_verified === false) {
    const err = new Error("Google email not verified");
    err.status = 401;
    throw err;
  }
  const email = payload.email.toLowerCase();
  const localPart = email.split("@")[0] || "User";
  const nameFromToken =
    typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim().slice(0, 200)
      : localPart.slice(0, 200);
  return {
    sub: payload.sub,
    email,
    name: nameFromToken,
  };
}
