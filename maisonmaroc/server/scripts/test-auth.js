/**
 * Authorization smoke tests against a running API (default http://localhost:3001).
 * Usage: npm run test:auth
 */
const BASE = process.env.API_BASE || "http://localhost:3001";

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
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
  const setCookie = r.headers.get("set-cookie");
  return { ...r, cookie: cookieFrom(setCookie) };
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
  const pub = await req("/api/properties");
  assert("PUBLIC GET /api/properties", pub.status === 200);

  const ownerDash = await req("/api/owner/properties");
  assert("PUBLIC GET /api/owner/properties denied", ownerDash.status === 401);

  const adminOwners = await req("/api/admin/owners");
  assert("PUBLIC GET /api/admin/owners denied", adminOwners.status === 401);

  const adminNews = await req("/api/admin/news");
  assert("PUBLIC GET /api/admin/news denied", adminNews.status === 401);

  const adminEvents = await req("/api/admin/events");
  assert("PUBLIC GET /api/admin/events denied", adminEvents.status === 401);

  const adminDocs = await req("/api/admin/documents");
  assert("PUBLIC GET /api/admin/documents denied", adminDocs.status === 401);

  const ownerReg = await req("/api/auth/owner/register", {
    method: "POST",
    body: JSON.stringify({ email: "x@y.com", password: "password1", name: "X" }),
  });
  assert("PUBLIC owner register denied", ownerReg.status === 403);

  const esc = await req("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify({
      email: `client-${Date.now()}@test.apio.ma`,
      password: "password123",
      name: "Test Client",
      role: "SUPER_ADMIN",
    }),
  });
  assert("Client register rejects role field", esc.status === 400);

  const clientEmail = `client-${Date.now()}@test.apio.ma`;
  const reg = await req("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify({
      email: clientEmail,
      password: "password123",
      name: "Test Client",
    }),
  });
  assert("Client register", reg.status === 201);

  const clientLogin = await login("/api/auth/client/login", clientEmail, "password123");
  assert("Client login", clientLogin.status === 200);

  const clientOwner = await req("/api/owner/properties", {
    headers: { Cookie: clientLogin.cookie },
  });
  assert("CLIENT owner API denied", clientOwner.status === 403);

  const clientAdmin = await req("/api/admin/owners", {
    headers: { Cookie: clientLogin.cookie },
  });
  assert("CLIENT admin API denied", clientAdmin.status === 403);

  const clientAdminNews = await req("/api/admin/news", {
    method: "POST",
    headers: { Cookie: clientLogin.cookie },
    body: JSON.stringify({ slug: "x", titleFr: "a", titleAr: "b", bodyFr: "c", bodyAr: "d" }),
  });
  assert("CLIENT admin news POST denied", clientAdminNews.status === 403);

  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@apio.ma";
  const adminPass = process.env.SUPER_ADMIN_PASSWORD || "change-me-on-first-login";
  const adminLogin = await login("/api/auth/admin/login", adminEmail, adminPass);
  assert("Super-admin login", adminLogin.status === 200);

  if (adminLogin.status === 200) {
    const owners = await req("/api/admin/owners", {
      headers: { Cookie: adminLogin.cookie },
    });
    assert("SUPER_ADMIN list owners", owners.status === 200);

    const create = await req("/api/admin/owners", {
      method: "POST",
      headers: { Cookie: adminLogin.cookie },
      body: JSON.stringify({
        email: `owner-${Date.now()}@test.apio.ma`,
        password: "password123",
        name: "Test Owner",
        ownerProfileId: "sara-benali",
        role: "SUPER_ADMIN",
      }),
    });
    assert("Admin create owner rejects role in body", create.status === 400);

    const create2 = await req("/api/admin/owners", {
      method: "POST",
      headers: { Cookie: adminLogin.cookie },
      body: JSON.stringify({
        email: `owner2-${Date.now()}@test.apio.ma`,
        password: "password123",
        name: "Test Owner 2",
        ownerProfileId: "sara-benali",
      }),
    });
    assert("Admin create owner", create2.status === 201);
    if (create2.status === 201) {
      assert("Created owner role", create2.body?.owner?.role === "REAL_ESTATE_OWNER");
    }

    const newsList = await req("/api/admin/news", { headers: { Cookie: adminLogin.cookie } });
    assert("SUPER_ADMIN list news", newsList.status === 200);

    const slug = `test-${Date.now()}`;
    const newsCreate = await req("/api/admin/news", {
      method: "POST",
      headers: { Cookie: adminLogin.cookie },
      body: JSON.stringify({
        slug,
        titleFr: "Test",
        titleAr: "اختبار",
        bodyFr: "Contenu test suffisamment long.",
        bodyAr: "محتوى اختبار.",
        published: false,
      }),
    });
    assert("SUPER_ADMIN create news", newsCreate.status === 201);

    const badNews = await req("/api/admin/news", {
      method: "POST",
      headers: { Cookie: adminLogin.cookie },
      body: JSON.stringify({ slug: "INVALID SLUG", titleFr: "x", titleAr: "y", bodyFr: "a", bodyAr: "b" }),
    });
    assert("Admin news rejects invalid slug", badNews.status === 400);

    const eventCreate = await req("/api/admin/events", {
      method: "POST",
      headers: { Cookie: adminLogin.cookie },
      body: JSON.stringify({
        titleFr: "Réunion test",
        titleAr: "اجتماع",
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        published: false,
      }),
    });
    assert("SUPER_ADMIN create event", eventCreate.status === 201);

    const docCreate = await req("/api/admin/documents", {
      method: "POST",
      headers: { Cookie: adminLogin.cookie },
      body: JSON.stringify({
        category: "publication",
        titleFr: "Doc test",
        titleAr: "وثيقة",
        visibility: "admin",
        published: false,
      }),
    });
    assert("SUPER_ADMIN create document", docCreate.status === 201);

    const publicDocs = await req("/api/content/documents");
    assert("Public documents API", publicDocs.status === 200);
    if (docCreate.status === 201 && publicDocs.status === 200) {
      const hidden = (publicDocs.body?.documents || []).some((d) => d.title?.fr === "Doc test");
      assert("Non-public document hidden from public API", !hidden);
    }
  }

  const demoEmail = process.env.DEMO_OWNER_EMAIL || "owner.demo@apio.ma";
  const demoPass = process.env.DEMO_OWNER_PASSWORD || "change-me-demo-owner";
  const ownerLogin = await login("/api/auth/owner/login", demoEmail, demoPass);
  assert("Owner login", ownerLogin.status === 200);

  if (ownerLogin.status === 200) {
    const mine = await req("/api/owner/properties", {
      headers: { Cookie: ownerLogin.cookie },
    });
    assert("OWNER own properties", mine.status === 200);
    const adminAsOwner = await req("/api/admin/owners", {
      headers: { Cookie: ownerLogin.cookie },
    });
    assert("OWNER admin denied", adminAsOwner.status === 403);

    const ownerNews = await req("/api/admin/events", {
      method: "POST",
      headers: { Cookie: ownerLogin.cookie },
      body: JSON.stringify({
        titleFr: "Hack",
        titleAr: "x",
        startsAt: new Date().toISOString(),
      }),
    });
    assert("OWNER admin events denied", ownerNews.status === 403);
  }

  const health = await req("/api/health");
  assert("GET /api/health minimal", health.status === 200 && health.body?.ok === true && !health.body?.env);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
