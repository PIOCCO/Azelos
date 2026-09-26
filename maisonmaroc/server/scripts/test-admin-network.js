/**
 * APIO Admin network isolation tests.
 * Requires public API on API_BASE and admin API on APIO_ADMIN_API_BASE.
 */
import { ADMIN_BASE, PUBLIC_BASE, adminLogin, adminReq } from "./test-admin-helper.js";

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

async function publicReq(path, opts = {}) {
  const res = await fetch(`${PUBLIC_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
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
  return { status: res.status, body };
}

async function main() {
  const blockedMembers = await publicReq("/api/admin/members");
  assert("Public API hides /api/admin/members (404)", blockedMembers.status === 404);

  const blockedLogin = await publicReq("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: "x@y.com", password: "nope" }),
  });
  assert("Public API hides /api/auth/admin/login (404)", blockedLogin.status === 404);

  const health = await adminReq("/api/health");
  assert("Admin listener health", health.status === 200 && health.body?.service === "apio-admin");

  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@apio.ma";
  const adminPass = process.env.SUPER_ADMIN_PASSWORD || "change-me-on-first-login";
  const login = await adminLogin(adminEmail, adminPass);
  assert("Admin login on admin port", login.status === 200 && login.cookie);

  if (login.cookie) {
    const members = await adminReq("/api/admin/members", { headers: { Cookie: login.cookie } });
    assert("Admin API members on admin port", members.status === 200);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log(`Admin base: ${ADMIN_BASE}`);
  console.log(`Public base: ${PUBLIC_BASE}`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
