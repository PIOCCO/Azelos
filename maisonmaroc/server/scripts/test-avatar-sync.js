/**
 * Profile avatar: public API URL must version on replace (cache-safe sync).
 * Usage: node scripts/test-avatar-sync.js
 */
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

function tinyJpeg(seed = 0) {
  const buf = Buffer.alloc(32);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  buf.fill(seed & 0xff, 4);
  return buf;
}

async function uploadAvatar(cookie, seed) {
  const fd = new FormData();
  fd.append("file", new Blob([tinyJpeg(seed)], { type: "image/jpeg" }), "avatar.jpg");
  return req("/api/owner/profile/avatar", { method: "POST", headers: { Cookie: cookie }, body: fd });
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
  const admin = await login(
    "/api/auth/admin/login",
    process.env.SUPER_ADMIN_EMAIL || "admin@apio.ma",
    process.env.SUPER_ADMIN_PASSWORD || "change-me-on-first-login",
  );
  assert("Avatar sync: admin login", admin.status === 200);

  const email = `avatar-sync-${Date.now()}@test.apio.ma`;
  const pass = "password123";
  const created = await req("/api/admin/members", {
    method: "POST",
    headers: { Cookie: admin.cookie },
    body: JSON.stringify({
      email,
      password: pass,
      name: "Avatar Test",
      companyFr: "Avatar Co",
      status: "ACTIVE",
    }),
  });
  assert("Avatar sync: create member", created.status === 201);
  const ownerProfileId = created.body?.member?.ownerProfileId;
  assert("Avatar sync: ownerProfileId present", Boolean(ownerProfileId));

  const owner = await login("/api/auth/owner/login", email, pass);
  assert("Avatar sync: owner login", owner.status === 200);

  const proj = await req("/api/owner/projects", {
    method: "POST",
    headers: { Cookie: owner.cookie },
    body: JSON.stringify({ titleFr: "Listing Avatar Test", cityId: "oujda", publish: true, price: 100000 }),
  });
  assert("Avatar sync: publish project for listings owner", proj.status === 201);

  const up1 = await uploadAvatar(owner.cookie, 1);
  assert("Avatar sync: upload #1", up1.status === 201);
  const url1 = up1.body?.publicProfile?.avatar;
  assert("Avatar sync: upload #1 returns versioned avatar URL", typeof url1 === "string" && url1.includes("?v="));

  const pub1 = await req(`/api/public/member-profiles/${ownerProfileId}`);
  assert("Avatar sync: public profile after #1", pub1.status === 200);
  const publicUrl1 = pub1.body?.profile?.avatar;
  assert("Avatar sync: public API matches owner bundle URL", publicUrl1 === url1);

  const listings1 = await req("/api/listings/member-properties");
  const listingOwner1 = (listings1.body?.owners || []).find((o) => o.id === ownerProfileId);
  assert(
    "Avatar sync: listings API owner avatar matches upload #1",
    listingOwner1?.avatar === url1,
  );

  const img1 = await req(publicUrl1);
  assert("Avatar sync: avatar file #1", img1.status === 200);

  await new Promise((r) => setTimeout(r, 5));
  const up2 = await uploadAvatar(owner.cookie, 2);
  assert("Avatar sync: upload #2", up2.status === 201);
  const url2 = up2.body?.publicProfile?.avatar;
  assert("Avatar sync: upload #2 changes version param", url2 && url2 !== url1);

  const pub2 = await req(`/api/public/member-profiles/${ownerProfileId}`);
  const publicUrl2 = pub2.body?.profile?.avatar;
  assert("Avatar sync: public API after #2 matches new URL", publicUrl2 === url2);

  const listings2 = await req("/api/listings/member-properties");
  const listingOwner2 = (listings2.body?.owners || []).find((o) => o.id === ownerProfileId);
  assert(
    "Avatar sync: listings API owner avatar updates to upload #2",
    listingOwner2?.avatar === url2,
  );

  const img2 = await req(publicUrl2);
  assert("Avatar sync: avatar file #2", img2.status === 200);

  const ownerBEmail = `avatar-b-${Date.now()}@test.apio.ma`;
  await req("/api/admin/members", {
    method: "POST",
    headers: { Cookie: admin.cookie },
    body: JSON.stringify({
      email: ownerBEmail,
      password: pass,
      name: "Avatar B",
      companyFr: "B Co",
      status: "ACTIVE",
    }),
  });
  const ownerB = await login("/api/auth/owner/login", ownerBEmail, pass);
  const hack = await uploadAvatar(ownerB.cookie, 9);
  assert("Avatar sync: Member B upload only affects self", hack.status === 201);
  const pubA = await req(`/api/public/member-profiles/${ownerProfileId}`);
  assert("Avatar sync: Member A public URL unchanged by B upload", pubA.body?.profile?.avatar === url2);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
