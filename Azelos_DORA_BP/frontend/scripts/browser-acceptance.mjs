import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";

async function countNavLinks(page) {
  return page.locator('nav[aria-label="Main"] a').count();
}

async function dragReactFlowNode(page, nodeLocator, dx, dy) {
  const box = await nodeLocator.boundingBox();
  if (!box) return false;
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(startX + (dx * i) / 20, startY + (dy * i) / 20);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  return true;
}

function parseTranslate(style) {
  const m = style?.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage();

  const puts = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/v1/dora/relationship-map/layout") && r.request().method() === "PUT") {
      puts.push({ status: r.status() });
    }
  });

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByLabel("Email").fill("admin@demo.bank");
  await page.getByLabel("Password").fill("ChangeMeNow!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(|\?)/, { timeout: 15000 });
  await page.waitForTimeout(500);
  const t0 = await countNavLinks(page);
  await page.waitForTimeout(10000);
  const t10 = await countNavLinks(page);
  for (let i = 0; i < 2; i++) {
    await page.reload();
    await page.waitForTimeout(500);
    await page.waitForTimeout(10000);
  }
  const r10 = await countNavLinks(page);

  const seeded = await page.evaluate(async () => {
    const raw = sessionStorage.getItem("dora.session");
    if (!raw) return { ok: false, reason: "no session" };
    const { token } = JSON.parse(raw);
    const graphRes = await fetch("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: "{ organizationGraph(depth:1,maxNodes:8){ nodes { id } } }",
      }),
    });
    const graphJson = await graphRes.json();
    const nodeId = graphJson?.data?.organizationGraph?.nodes?.[0]?.id;
    if (!nodeId) return { ok: false, reason: "no nodes" };
    const positions = { [nodeId]: { x: 912, y: 488 } };
    const putRes = await fetch("/api/v1/dora/relationship-map/layout", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ positions }),
    });
    return { ok: putRes.ok, nodeId, status: putRes.status };
  });

  await page.goto(`${BASE}/dora/relationship-map`, { waitUntil: "networkidle" });
  await page.waitForSelector(".react-flow__node", { timeout: 30000 });
  await page.waitForTimeout(3000);
  const node = page.locator(".react-flow__node").first();
  const styleAfterSeed = await node.getAttribute("style");
  const flowPosAfterSeed = parseTranslate(styleAfterSeed);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".react-flow__node", { timeout: 30000 });
  await page.waitForTimeout(3000);
  const styleAfterRefresh = await node.getAttribute("style");
  const flowPosAfterRefresh = parseTranslate(styleAfterRefresh);

  const before = await node.boundingBox();
  await dragReactFlowNode(page, node, 180, 100);
  await page.waitForTimeout(3500);
  const afterDrag = await node.boundingBox();

  console.log(
    JSON.stringify(
      {
        sidebar: { t0, t10, r10, stable: t0 === t10 && t10 === r10 },
        layoutSeed: seeded,
        layoutPutAfterDrag: puts,
        persistedLoad: {
          afterSeed: flowPosAfterSeed,
          afterRefresh: flowPosAfterRefresh,
          matchesSeed:
            flowPosAfterSeed &&
            flowPosAfterRefresh &&
            Math.abs(flowPosAfterSeed.x - 912) < 2 &&
            Math.abs(flowPosAfterSeed.y - 488) < 2 &&
            Math.abs(flowPosAfterRefresh.x - flowPosAfterSeed.x) < 2 &&
            Math.abs(flowPosAfterRefresh.y - flowPosAfterSeed.y) < 2,
        },
        drag: {
          before,
          afterDrag,
          moved:
            before && afterDrag
              ? Math.abs(afterDrag.x - before.x) + Math.abs(afterDrag.y - before.y) > 8
              : false,
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
