import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";

const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

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
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

export function createOAuthState() {
  const state = crypto.randomBytes(24).toString("hex");
  pendingStates.set(state, Date.now() + STATE_TTL_MS);
  pruneStates();
  return state;
}

export function consumeOAuthState(state) {
  if (!state || !pendingStates.has(state)) {
    const err = new Error("Invalid OAuth state");
    err.status = 400;
    throw err;
  }
  pendingStates.delete(state);
}

function pruneStates() {
  const now = Date.now();
  for (const [k, exp] of pendingStates) {
    if (exp < now) pendingStates.delete(k);
  }
}

export function googleAuthUrl(state) {
  const oauth = client();
  return oauth.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
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
  const oauth = client();
  const ticket = await oauth.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
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
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
  };
}
