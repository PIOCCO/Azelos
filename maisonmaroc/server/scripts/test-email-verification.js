/**
 * Email verification & password reset token lifecycle (in-process, SMTP capture mode).
 */
process.env.SMTP_TEST_MODE = "capture";
process.env.NODE_ENV = "test";
process.env.EMAIL_FROM = "test@apio.ma";
process.env.FRONTEND_URL = "http://localhost:5173/APIO";

import { openDb, migrate } from "../src/db.js";
import { createUser, hashPassword, findUserByEmail, setUserPassword, verifyPassword } from "../src/auth.js";
import { clearTestOutbox, getTestOutbox } from "../src/mail.js";
import {
  sendEmailVerification,
  verifyEmailWithToken,
  sendPasswordReset,
  resetPasswordWithToken,
} from "../src/authVerification.js";
import { TOKEN_PURPOSE, consumeAuthToken } from "../src/authTokens.js";

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    passed++;
    console.log(`OK  ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}`);
  }
}

function extractToken() {
  const msg = getTestOutbox().at(-1);
  const raw = msg?.html || msg?.text || "";
  const m = /token=([^"&\s]+)/.exec(raw);
  return m ? decodeURIComponent(m[1]) : null;
}

const db = openDb();
migrate(db);
clearTestOutbox();

const email = `verify-${Date.now()}@test.apio.ma`;
const user = createUser(db, {
  email,
  passwordHash: hashPassword("SecurePass-1"),
  name: "Verify Test",
  role: "CLIENT",
  authProvider: "local",
});

await sendEmailVerification(db, user);
const v1 = extractToken();
assert("Verification email captured", Boolean(v1));

const ok = verifyEmailWithToken(db, v1);
assert("First verify succeeds", ok.ok === true);
assert("User marked verified", Boolean(findUserByEmail(db, email).email_verified_at));

const reuse = verifyEmailWithToken(db, v1);
assert("Reused verification token fails", reuse.ok === false);

clearTestOutbox();
await sendPasswordReset(db, email);
const resetTok = extractToken();
assert("Reset email captured", Boolean(resetTok));

const consumed = resetPasswordWithToken(db, resetTok, "NewSecurePass-2");
assert("Reset token consumed", consumed.ok === true);
setUserPassword(db, consumed.userId, "NewSecurePass-2");
assert("New password works", verifyPassword("NewSecurePass-2", findUserByEmail(db, email).password_hash));

const bad = consumeAuthToken(db, TOKEN_PURPOSE.PASSWORD_RESET, resetTok);
assert("Reset token not reusable", bad.ok === false);

db.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
