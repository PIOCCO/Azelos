/**
 * Wait for the API health endpoint before starting Vite (avoids proxy ECONNREFUSED spam).
 */
const url = process.env.API_HEALTH_URL || "http://127.0.0.1:3001/api/health";
const timeoutMs = Number(process.env.API_WAIT_TIMEOUT_MS || 120_000);
const intervalMs = 500;
const start = Date.now();

async function ping() {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

while (Date.now() - start < timeoutMs) {
  if (await ping()) {
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}

console.error(
  `\n[APIO] Backend not reachable at ${url}\n` +
    `Start it with: cd maisonmaroc/server && npm install && npm run migrate && npm run dev\n` +
    `Or from maisonmaroc: npm run dev   (starts API + Vite together)\n`,
);
process.exit(1);
