/**
 * Start API + Vite without concurrently (Node 18+ compatible).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const serverDir = path.join(root, "server");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(name, cwd, args, env = process.env) {
  const child = spawn(npmCmd, args, {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else if (code && code !== 0) shutdown(code);
  });
  return child;
}

let api = null;
let web = null;

function shutdown(code = 0) {
  if (api && !api.killed) api.kill("SIGTERM");
  if (web && !web.killed) web.kill("SIGTERM");
  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function waitForApi() {
  const url = process.env.API_HEALTH_URL || "http://127.0.0.1:3001/api/health";
  const timeoutMs = Number(process.env.API_WAIT_TIMEOUT_MS || 120_000);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(
    "\n[APIO] Backend did not start on port 3001.\n" +
      "Try: cd server && npm install && npm run migrate && npm run dev\n",
  );
  shutdown(1);
}

console.log("[APIO] Starting API (server/)…");
api = run("api", serverDir, ["run", "dev"]);

await waitForApi();
console.log("[APIO] API ready — starting Vite…");
web = run("web", root, ["run", "dev:web"]);
