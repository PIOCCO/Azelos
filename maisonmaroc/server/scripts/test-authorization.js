/**
 * Authorization regression tests (API on API_BASE, default http://localhost:3001).
 */
import { markUserEmailVerified } from "./test-db-helper.js";

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
  const unauthProject = await req("/api/owner/projects", { method: "POST", body: JSON.stringify({ titleFr: "X" }) });
  assert("Unauthenticated project create denied", unauthProject.status === 401);

  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@apio.ma";
  const adminPass = process.env.SUPER_ADMIN_PASSWORD || "change-me-on-first-login";
  const admin = await login("/api/auth/admin/login", adminEmail, adminPass);

  const ownerAEmail = `owner-a-${Date.now()}@test.apio.ma`;
  let ownerA = { status: 401, cookie: "" };
  if (admin.status === 200) {
    const createdA = await req("/api/admin/members", {
      method: "POST",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({
        email: ownerAEmail,
        password: "password123",
        name: "Owner A",
        companyFr: "Company A",
        cityId: "oujda",
      }),
    });
    assert("Admin creates owner A for tests", createdA.status === 201);
    if (createdA.status === 201) {
      markUserEmailVerified(ownerAEmail);
      ownerA = await login("/api/auth/owner/login", ownerAEmail, "password123");
    }
  }
  assert("Owner A login", ownerA.status === 200);

  let projectAId = null;
  if (ownerA.status === 200) {
    const mass = await req("/api/owner/projects", {
      method: "POST",
      headers: { Cookie: ownerA.cookie },
      body: JSON.stringify({
        titleFr: "Mass test",
        ownerProfileId: "other-member",
        role: "SUPER_ADMIN",
        hidden: true,
      }),
    });
    assert("Project create rejects mass-assignment fields", mass.status === 400);

    const create = await req("/api/owner/projects", {
      method: "POST",
      headers: { Cookie: ownerA.cookie },
      body: JSON.stringify({ titleFr: "Auth test project", cityId: "oujda", publish: true }),
    });
    assert("Owner A creates and publishes project", create.status === 201);
    projectAId = create.body?.project?.id;

    const roleMe = await req("/api/owner/me", {
      method: "PATCH",
      headers: { Cookie: ownerA.cookie },
      body: JSON.stringify({ role: "SUPER_ADMIN" }),
    });
    assert("Owner cannot escalate role via /me", roleMe.status === 400);

    const avatarHack = await req("/api/owner/profile", {
      method: "PATCH",
      headers: { Cookie: ownerA.cookie },
      body: JSON.stringify({ avatar_storage: "../../../etc/passwd" }),
    });
    assert("Profile patch rejects avatar_storage", avatarHack.status === 400);

    const avatarUrlHack = await req("/api/owner/profile", {
      method: "PATCH",
      headers: { Cookie: ownerA.cookie },
      body: JSON.stringify({ avatarUrl: "https://example.com/photo.jpg" }),
    });
    assert("Profile patch rejects avatarUrl", avatarUrlHack.status === 400);

    const adminAsOwner = await req("/api/admin/members", { headers: { Cookie: ownerA.cookie } });
    assert("Owner cannot list admin members", adminAsOwner.status === 403);

    const adminCreate = await req("/api/admin/members", {
      method: "POST",
      headers: { Cookie: ownerA.cookie },
      body: JSON.stringify({
        email: "hack@apio.ma",
        password: "password123",
        name: "Hack",
        companyFr: "X",
      }),
    });
    assert("Owner cannot create members", adminCreate.status === 403);
  }

  if (admin.status === 200 && ownerA.status === 200) {
    const ownerBEmail = `owner-b-${Date.now()}@test.apio.ma`;
    const createB = await req("/api/admin/members", {
      method: "POST",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({
        email: ownerBEmail,
        password: "password123",
        name: "Owner B",
        companyFr: "Company B",
        status: "ACTIVE",
      }),
    });
    assert("Admin creates member B", createB.status === 201);
    if (createB.status === 201) markUserEmailVerified(ownerBEmail);

    const ownerB = await login("/api/auth/owner/login", ownerBEmail, "password123");
    assert("Owner B login", ownerB.status === 200);

    if (projectAId && ownerB.status === 200) {
      const getHack = await req(`/api/owner/projects/${projectAId}`, { headers: { Cookie: ownerB.cookie } });
      assert("Owner B cannot GET Owner A project", getHack.status === 404);

      const patchHack = await req(`/api/owner/projects/${projectAId}`, {
        method: "PATCH",
        headers: { Cookie: ownerB.cookie },
        body: JSON.stringify({ titleFr: "Stolen", publish: true }),
      });
      assert("Owner B cannot PATCH Owner A project", patchHack.status === 404);

      const delHack = await req(`/api/owner/projects/${projectAId}`, {
        method: "DELETE",
        headers: { Cookie: ownerB.cookie },
      });
      assert("Owner B cannot DELETE Owner A project", delHack.status === 404);

      const imgHack = await req(`/api/owner/projects/${projectAId}/images`, {
        method: "POST",
        headers: { Cookie: ownerB.cookie },
        body: new FormData(),
      });
      assert("Owner B cannot POST image to Owner A project", imgHack.status === 400 || imgHack.status === 404);
    }

    const suspendedEmail = `owner-susp-${Date.now()}@test.apio.ma`;
    await req("/api/admin/members", {
      method: "POST",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({
        email: suspendedEmail,
        password: "password123",
        name: "Suspended",
        companyFr: "Susp Co",
        status: "DISABLED",
      }),
    });
    const suspLogin = await login("/api/auth/owner/login", suspendedEmail, "password123");
    assert("Suspended member login denied", suspLogin.status === 403);

    const adminProj = await req("/api/admin/member-projects", { headers: { Cookie: admin.cookie } });
    assert("Admin lists member projects", adminProj.status === 200);

    const ownerAdminProj = await req("/api/admin/member-projects", { headers: { Cookie: ownerA.cookie } });
    assert("Owner cannot access admin member-projects", ownerAdminProj.status === 403);
  }

  const clientEmail = `client-auth-${Date.now()}@test.apio.ma`;
  await req("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password: "password123", name: "Client" }),
  });
  const client = await login("/api/auth/client/login", clientEmail, "password123");
  if (client.status === 200) {
    const clientMember = await req("/api/admin/members", {
      method: "POST",
      headers: { Cookie: client.cookie },
      body: JSON.stringify({
        email: "c2@apio.ma",
        password: "password123",
        name: "C",
        companyFr: "C",
      }),
    });
    assert("Client cannot create members", clientMember.status === 403);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
