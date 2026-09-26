/**
 * Public Actualités API tests (API_BASE default http://localhost:3001).
 */
import { openDb, migrate } from "../src/db.js";
import { adminUpsertNews } from "../src/content.js";
import { adminLogin, adminReq } from "./test-admin-helper.js";

const BASE = process.env.API_BASE || "http://localhost:3001";

async function pub(path) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
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
  const list = await pub("/api/content/news?limit=5");
  assert("Public news list", list.status === 200 && Array.isArray(list.body?.articles));
  assert("Public news has featured field", list.body && "featured" in list.body);

  const cats = await pub("/api/content/news/categories");
  assert("News categories", cats.status === 200 && Array.isArray(cats.body?.categories));

  const draftSlug = `draft-${Date.now()}`;
  const db = openDb();
  migrate(db);
  const draftId = adminUpsertNews(db, {
    id: null,
    slug: draftSlug,
    titleFr: "Brouillon test",
    titleAr: "مسودة",
    summaryFr: "",
    summaryAr: "",
    bodyFr: "Contenu brouillon suffisamment long pour validation.",
    bodyAr: "محتوى.",
    published: false,
    featured: false,
    category: "association",
  });
  assert("Draft created in DB", Boolean(draftId));
  const draftPublic = await pub(`/api/content/news/${draftSlug}`);
  assert("Draft not public by slug", draftPublic.status === 404);
  db.prepare(`DELETE FROM news_posts WHERE id = ?`).run(draftId);

  const admin = await adminLogin(
    process.env.SUPER_ADMIN_EMAIL || "admin@apio.ma",
    process.env.SUPER_ADMIN_PASSWORD || "change-me-on-first-login",
  );
  if (admin.status === 200 && admin.cookie) {
    const slug = `pub-${Date.now()}`;
    const created = await adminReq("/api/admin/news", {
      method: "POST",
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({
        slug,
        titleFr: "Article test public",
        titleAr: "اختبار",
        bodyFr: "Corps de l'article de test avec contenu suffisant.",
        bodyAr: "محتوى.",
        category: "communiques",
        featured: true,
        published: true,
      }),
    });
    assert("Admin publishes news", created.status === 201);
    const live = await pub(`/api/content/news/${slug}`);
    assert("Published article readable", live.status === 200 && live.body?.article?.slug === slug);
    assert("Related array present", Array.isArray(live.body?.related));
    if (created.status === 201) {
      await adminReq(`/api/admin/news/${created.body.id}`, {
        method: "DELETE",
        headers: { Cookie: admin.cookie },
      });
    }
  } else {
    console.warn("SKIP admin publish test");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
