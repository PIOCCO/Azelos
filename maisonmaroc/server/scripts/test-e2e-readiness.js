/**
 * End-to-end production-readiness scenario (local API on API_BASE).
 * Usage: npm run test:e2e
 */
import { markUserEmailVerified } from "./test-db-helper.js";
import { adminLogin as adminPortLogin, adminReq } from "./test-admin-helper.js";

const BASE = process.env.API_BASE || "http://localhost:3001";

async function req(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
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

function cookieFrom(setCookie) {
  if (!setCookie) return "";
  const m = /apio_token=([^;]+)/.exec(setCookie);
  return m ? `apio_token=${m[1]}` : "";
}

async function login(path, email, password) {
  const r = await req(path, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { ...r, cookie: cookieFrom(r.headers.get("set-cookie")) };
}

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

async function main() {
  const admin = await adminPortLogin(
    process.env.SUPER_ADMIN_EMAIL || "admin@apio.ma",
    process.env.SUPER_ADMIN_PASSWORD || "change-me-on-first-login",
  );
  assert("E2E: SUPER_ADMIN login", admin.status === 200);

  const emailA = `e2e-a-${Date.now()}@test.apio.ma`;
  const emailB = `e2e-b-${Date.now()}@test.apio.ma`;
  const pass = "password123";

  const createA = await adminReq("/api/admin/members", {
    method: "POST",
    headers: { Cookie: admin.cookie },
    body: JSON.stringify({
      email: emailA,
      password: pass,
      name: "Member A",
      companyFr: "Company A",
      status: "ACTIVE",
    }),
  });
  assert("E2E: create Member A", createA.status === 201);
  const userAId = createA.body?.member?.id;
  if (createA.status === 201) markUserEmailVerified(emailA);

  const createB = await adminReq("/api/admin/members", {
    method: "POST",
    headers: { Cookie: admin.cookie },
    body: JSON.stringify({
      email: emailB,
      password: pass,
      name: "Member B",
      companyFr: "Company B",
      status: "ACTIVE",
    }),
  });
  assert("E2E: create Member B", createB.status === 201);
  if (createB.status === 201) markUserEmailVerified(emailB);

  const memberA = await login("/api/auth/owner/login", emailA, pass);
  const memberB = await login("/api/auth/owner/login", emailB, pass);
  assert("E2E: Member A login", memberA.status === 200);
  assert("E2E: Member B login", memberB.status === 200);

  let projectId = null;
  if (memberA.status === 200) {
    const createProj = await req("/api/owner/projects", {
      method: "POST",
      headers: { Cookie: memberA.cookie },
      body: JSON.stringify({
        titleFr: "Project A E2E",
        titleAr: "مشروع",
        cityId: "oujda",
        publish: true,
        price: 500000,
      }),
    });
    assert("E2E: Member A creates and publishes Project A", createProj.status === 201);
    projectId = createProj.body?.project?.id;

    const listings = await req("/api/listings/member-properties");
    const publicVisible =
      projectId &&
      (listings.body?.properties || []).some((p) => p.id === projectId);
    assert("E2E: Project A public immediately (no admin approval)", publicVisible);

    if (projectId && memberB.status === 200) {
      const hack = await req(`/api/owner/projects/${projectId}`, {
        method: "PATCH",
        headers: { Cookie: memberB.cookie },
        body: JSON.stringify({ titleFr: "Stolen" }),
      });
      assert("E2E: Member B cannot edit Project A", hack.status === 404);

      const hackDel = await req(`/api/owner/projects/${projectId}`, {
        method: "DELETE",
        headers: { Cookie: memberB.cookie },
      });
      assert("E2E: Member B cannot delete Project A", hackDel.status === 404);
    }

    if (projectId) {
      const edit = await req(`/api/owner/projects/${projectId}`, {
        method: "PATCH",
        headers: { Cookie: memberA.cookie },
        body: JSON.stringify({ titleFr: "Project A E2E Updated" }),
      });
      assert("E2E: Member A edits own Project A", edit.status === 200);
    }
  }

  if (projectId && admin.status === 200) {
    const hide = await adminReq(`/api/admin/member-projects/${projectId}`, {
      method: "PATCH",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({ hidden: true }),
    });
    assert("E2E: SUPER_ADMIN hides Project A", hide.status === 200);

    const listingsAfter = await req("/api/listings/member-properties");
    const stillPublic = (listingsAfter.body?.properties || []).some((p) => p.id === projectId);
    assert("E2E: Hidden project removed from public listings", !stillPublic);
  }

  if (userAId && admin.status === 200 && memberA.status === 200) {
    const suspend = await adminReq(`/api/admin/members/${userAId}`, {
      method: "PATCH",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({ status: "DISABLED" }),
    });
    assert("E2E: SUPER_ADMIN suspends Member A", suspend.status === 200);

    const afterSuspend = await req("/api/owner/projects", {
      method: "POST",
      headers: { Cookie: memberA.cookie },
      body: JSON.stringify({ titleFr: "Should fail", cityId: "oujda" }),
    });
    assert("E2E: Suspended Member A cannot create project", afterSuspend.status === 401);

    const relogin = await login("/api/auth/owner/login", emailA, pass);
    assert("E2E: Suspended Member A login denied", relogin.status === 403);
  }

  const health = await req("/api/health");
  assert("E2E: health ok without secrets", health.status === 200 && !health.body?.env && !health.body?.JWT_SECRET);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
