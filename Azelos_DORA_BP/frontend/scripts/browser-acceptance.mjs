import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";

async function navLabels(page) {
  return page.locator('nav[aria-label="Main"] a span.truncate').allTextContents();
}

function parseTranslate(style) {
  const m = style?.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage();

  const moduleResponses = [];
  page.on("response", async (r) => {
    const url = r.url();
    if (url.includes("/modules") || url.includes("/applicability")) {
      let body = null;
      try {
        body = await r.json();
      } catch {
        body = null;
      }
      moduleResponses.push({
        url: url.replace(/^https?:\/\/[^/]+/, ""),
        status: r.status(),
        len: Array.isArray(body) ? body.length : body?.modules?.length ?? null,
        enabledCount: Array.isArray(body)
          ? body.filter((m) => m.enabled && !m.disabled).length
          : body?.modules?.filter((m) => m.enabled && !m.disabled).length ?? null,
      });
    }
  });

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByLabel("Email").fill("admin@demo.bank");
  await page.getByLabel("Password").fill("ChangeMeNow!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(|\?)/, { timeout: 15000 });

  const earlyLabels = await navLabels(page);
  await page.waitForTimeout(10000);
  const lateLabels = await navLabels(page);

  await page.reload({ waitUntil: "networkidle" });
  const rEarly = await navLabels(page);
  await page.waitForTimeout(10000);
  const rLate = await navLabels(page);

  const seeded = await page.evaluate(async () => {
    const raw = sessionStorage.getItem("dora.session");
    const { token } = JSON.parse(raw);
    const graphRes = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: "{ organizationGraph(depth:1,maxNodes:8){ nodes { id } } }" }),
    });
    const nodeId = (await graphRes.json())?.data?.organizationGraph?.nodes?.[0]?.id;
    const positions = { [nodeId]: { x: 845, y: 512 } };
    const putRes = await fetch("/api/v1/dora/relationship-map/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ positions }),
    });
    return { ok: putRes.ok, nodeId };
  });

  await page.goto(`${BASE}/dora/relationship-map`, { waitUntil: "networkidle" });
  await page.waitForSelector(".react-flow__node", { timeout: 30000 });
  await page.waitForTimeout(1500);
  const styleNoClick = await page.locator(".react-flow__node").first().getAttribute("style");
  const posNoClick = parseTranslate(styleNoClick);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".react-flow__node", { timeout: 30000 });
  await page.waitForTimeout(1500);
  const styleAfterRefreshNoClick = await page.locator(".react-flow__node").first().getAttribute("style");
  const posAfterRefreshNoClick = parseTranslate(styleAfterRefreshNoClick);

  console.log(
    JSON.stringify(
      {
        sidebar: {
          earlyCount: earlyLabels.length,
          lateCount: lateLabels.length,
          stableAfterLoad: earlyLabels.join("|") === lateLabels.join("|"),
          refreshEarlyCount: rEarly.length,
          refreshLateCount: rLate.length,
          stableAfterRefresh: rEarly.join("|") === rLate.join("|"),
        },
        moduleApi: moduleResponses,
        relationMap: {
          seed: seeded,
          posNoClick,
          posAfterRefreshNoClick,
          savedLayoutOnFirstPaint:
            posNoClick &&
            Math.abs(posNoClick.x - 845) < 3 &&
            Math.abs(posNoClick.y - 512) < 3,
          savedLayoutAfterRefreshNoClick:
            posAfterRefreshNoClick &&
            Math.abs(posAfterRefreshNoClick.x - 845) < 3 &&
            Math.abs(posAfterRefreshNoClick.y - 512) < 3,
        },
      },
      null,
      2,
    ),
  );
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
