/**
 * Security regression tests (requires API on API_BASE, default http://localhost:3001).
 * Usage: npm run test:security
 */
const BASE = process.env.API_BASE || "http://localhost:3001";

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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

async function adminLogin() {
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@apio.ma";
  const password = process.env.SUPER_ADMIN_PASSWORD || "change-me-on-first-login";
  const r = await req("/api/auth/admin/login", {
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
  const traversal = await req("/api/content/documents/../../../etc/passwd/file");
  assert("Document path traversal blocked", traversal.status === 404);

  const badId = await req("/api/content/documents/not%00valid/file");
  assert("Document null-byte id blocked", badId.status === 404);

  const xssNews = await req("/api/content/news/<script>alert(1)</script>");
  assert("News slug XSS path not found", xssNews.status === 404);

  const sqli = await req("/api/content/news?limit=1;DROP%20TABLE%20users--");
  assert("News pagination SQLi safe", sqli.status === 200 || sqli.status === 429);

  const admin = await adminLogin();
  if (admin.status === 200) {
    const badUrl = await req("/api/admin/news", {
      method: "POST",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({
        slug: `sec-${Date.now()}`,
        titleFr: "T",
        titleAr: "T",
        bodyFr: "Contenu test suffisamment long.",
        bodyAr: "محتوى.",
        imageUrl: "javascript:alert(1)",
      }),
    });
    assert("Admin news rejects javascript: imageUrl", badUrl.status === 400);

    const ssrfUrl = await req("/api/admin/news", {
      method: "POST",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({
        slug: `sec2-${Date.now()}`,
        titleFr: "T",
        titleAr: "T",
        bodyFr: "Contenu test suffisamment long.",
        bodyAr: "محتوى.",
        imageUrl: "http://127.0.0.1/internal",
      }),
    });
    assert("Admin news rejects loopback imageUrl", ssrfUrl.status === 400);

    const doc = await req("/api/admin/documents", {
      method: "POST",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({
        category: "institutionnel",
        titleFr: "Upload test",
        titleAr: "و",
        visibility: "admin",
        published: false,
      }),
    });
    if (doc.status === 201 && doc.body?.id) {
      const fd = new FormData();
      fd.append(
        "file",
        new Blob(["NOT A PDF FILE AT ALL"], { type: "application/pdf" }),
        "evil.pdf",
      );
      const fakePdf = await req(`/api/admin/documents/${doc.body.id}/upload`, {
        method: "POST",
        headers: { Cookie: admin.cookie },
        body: fd,
      });
      assert("Fake PDF magic bytes rejected", fakePdf.status === 400);

      const fd2 = new FormData();
      fd2.append(
        "file",
        new Blob(["<svg onload=alert(1)>"], { type: "application/pdf" }),
        "evil.svg.pdf",
      );
      const svg = await req(`/api/admin/documents/${doc.body.id}/upload`, {
        method: "POST",
        headers: { Cookie: admin.cookie },
        body: fd2,
      });
      assert("SVG/markup disguised as PDF rejected", svg.status === 400);

      await req(`/api/admin/documents/${doc.body.id}`, {
        method: "DELETE",
        headers: { Cookie: admin.cookie },
      });
    } else {
      assert("Admin document create for upload test", false);
    }
  } else {
    console.warn("SKIP admin upload tests (admin login failed)");
  }

  const clientEmail = `sec-${Date.now()}@test.apio.ma`;
  await req("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password: "password123", name: "Sec Client" }),
  });
  const clientLogin = await req("/api/auth/client/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password: "password123" }),
  });
  const clientCookie = cookieFrom(clientLogin.headers.get("set-cookie"));
  const idor = await req("/api/messages/conversations/00000000-0000-4000-8000-000000000001", {
    headers: { Cookie: clientCookie },
  });
  assert("Messages IDOR returns 404", idor.status === 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
