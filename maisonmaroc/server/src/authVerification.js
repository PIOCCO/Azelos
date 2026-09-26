import { findUserByEmail, findUserById, markEmailVerified } from "./auth.js";
import { sendEmail, publicAppUrl, isEmailConfigured } from "./mail.js";
import { TOKEN_PURPOSE, createAuthToken, consumeAuthToken, recordFailedTokenAttempt } from "./authTokens.js";

const GENERIC_RESET_MSG =
  "If an account exists for this email, you will receive password reset instructions shortly.";

export { isEmailConfigured };

export function isEmailVerified(userRow) {
  if (!userRow) return false;
  if (userRow.auth_provider === "google") return true;
  return Boolean(userRow.email_verified_at);
}

export function assertEmailVerifiedForLogin(userRow) {
  if (isEmailVerified(userRow)) return;
  const err = new Error("Email verification required. Check your inbox or request a new link.");
  err.status = 403;
  err.code = "EMAIL_NOT_VERIFIED";
  throw err;
}

function verificationEmailContent(rawToken) {
  const url = publicAppUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);
  const text = `Verify your APIO account by opening this link (valid for a limited time):\n${url}\n`;
  const html = `<p>Verify your APIO account by clicking the link below (valid for a limited time):</p><p><a href="${url}">Verify email</a></p>`;
  return { url, text, html };
}

function resetEmailContent(rawToken) {
  const url = publicAppUrl(`/reset-password?token=${encodeURIComponent(rawToken)}`);
  const text = `Reset your APIO password:\n${url}\nIf you did not request this, ignore this email.`;
  const html = `<p>Reset your APIO password:</p><p><a href="${url}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`;
  return { url, text, html };
}

export async function sendEmailVerification(db, userRow) {
  const { raw } = createAuthToken(db, userRow.id, TOKEN_PURPOSE.EMAIL_VERIFY);
  const { text, html } = verificationEmailContent(raw);
  await sendEmail({
    to: userRow.email,
    subject: "Verify your APIO account",
    text,
    html,
  });
}

export async function sendPasswordReset(db, email) {
  const normalized = String(email || "").trim().toLowerCase();
  const user = findUserByEmail(db, normalized);
  if (!user || user.auth_provider !== "local" || !user.password_hash) {
    return { ok: true, message: GENERIC_RESET_MSG };
  }
  const { raw } = createAuthToken(db, user.id, TOKEN_PURPOSE.PASSWORD_RESET);
  const { text, html } = resetEmailContent(raw);
  await sendEmail({ to: user.email, subject: "Reset your APIO password", text, html });
  return { ok: true, message: GENERIC_RESET_MSG };
}

export function verifyEmailWithToken(db, rawToken) {
  const result = consumeAuthToken(db, TOKEN_PURPOSE.EMAIL_VERIFY, rawToken);
  if (!result.ok) {
    recordFailedTokenAttempt(db, TOKEN_PURPOSE.EMAIL_VERIFY, rawToken);
    return result;
  }
  markEmailVerified(db, result.userId);
  return { ok: true, user: findUserById(db, result.userId) };
}

export function resetPasswordWithToken(db, rawToken, newPassword) {
  const result = consumeAuthToken(db, TOKEN_PURPOSE.PASSWORD_RESET, rawToken);
  if (!result.ok) {
    recordFailedTokenAttempt(db, TOKEN_PURPOSE.PASSWORD_RESET, rawToken);
    return result;
  }
  const user = findUserById(db, result.userId);
  if (!user) return { ok: false, error: "Invalid token", status: 400 };
  return { ok: true, userId: user.id };
}

export async function resendVerificationEmail(db, email) {
  const normalized = String(email || "").trim().toLowerCase();
  const user = findUserByEmail(db, normalized);
  if (!user || isEmailVerified(user)) {
    return {
      ok: true,
      message: "If an unverified account exists, a verification email has been sent.",
    };
  }
  await sendEmailVerification(db, user);
  return {
    ok: true,
    message: "If an unverified account exists, a verification email has been sent.",
  };
}
