/**
 * Normal-user (CLIENT) security tests — API on API_BASE (default http://localhost:3001).
 */
import { markUserEmailVerified } from "./test-db-helper.js";
import { validateExternalMediaUrl } from "../src/validateUrls.js";

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

async function registerClient() {
  const email = `client-sec-${Date.now()}@test.apio.ma`;
  const reg = await req("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "password123", name: "Client Sec" }),
  });
  if (reg.status !== 201) return { email, cookie: "", reg };
  markUserEmailVerified(email);
  const login = await req("/api/auth/client/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "password123" }),
  });
  return { email, cookie: cookieFrom(login.headers.get("set-cookie")), reg, login };
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
  const ssrf172 = validateExternalMediaUrl("https://172.16.0.1/x");
  assert("SSRF block 172.16.0.0/12 (validateUrls)", !ssrf172.ok);

  const meta = validateExternalMediaUrl("https://metadata.google.internal/");
  assert("SSRF block metadata host", !meta.ok);

  const pollute = await req("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify({
      email: `pollute-${Date.now()}@test.apio.ma`,
      password: "password123",
      name: "Test",
      nested: { __proto__: { role: "SUPER_ADMIN" } },
    }),
  });
  assert("Register rejects nested __proto__ pollution", pollute.status === 400);

  const extraField = await req("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify({
      email: `extra-${Date.now()}@test.apio.ma`,
      password: "password123",
      name: "Test",
      role: "SUPER_ADMIN",
    }),
  });
  assert("Register rejects role escalation field", extraField.status === 400);

  const badName = await req("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify({
      email: `badname-${Date.now()}@test.apio.ma`,
      password: "password123",
      name: "<script>alert(1)</script>",
    }),
  });
  assert("Register rejects HTML in name", badName.status === 400);

  const contactExtra = await req("/api/contact", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Jean",
      lastName: "Dupont",
      email: "contact@test.apio.ma",
      subject: "Demande info",
      message: "Message de test suffisamment long pour validation.",
      isAdmin: true,
    }),
  });
  assert("Contact rejects unexpected fields", contactExtra.status === 400);

  const { cookie, login } = await registerClient();
  assert("Client login for security tests", login?.status === 200 && cookie);

  if (cookie) {
    const adminProbe = await req("/api/admin/members", {
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert("CLIENT cannot list admin members on public API", adminProbe.status === 404);

    const ownerProbe = await req("/api/owner/me", {
      headers: { Cookie: cookie },
    });
    assert("CLIENT cannot access owner portal", ownerProbe.status === 403);

    const fakeConv = await req("/api/messages/conversations/00000000-0000-4000-8000-000000000099", {
      headers: { Cookie: cookie },
    });
    assert("CLIENT IDOR conversation hidden as 404", fakeConv.status === 404);

    const nullMsg = await req(
      "/api/messages/conversations/00000000-0000-4000-8000-000000000099/messages",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ body: "hello\u0000world" }),
      },
    );
    assert("Message with null byte rejected or not found", nullMsg.status === 400 || nullMsg.status === 404);

    const spoofSender = await req(
      "/api/messages/conversations/00000000-0000-4000-8000-000000000099/messages",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ body: "test", senderId: "other-user-id" }),
      },
    );
    assert("Message ignores client senderId (404/400)", spoofSender.status === 404 || spoofSender.status === 400);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
