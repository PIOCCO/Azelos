import "dotenv/config";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { openDb, migrate } from "./db.js";
import { applySecurityMiddleware } from "./security.js";
import { rejectPrototypePollutionMiddleware } from "./requestSecurity.js";
import { requireAdminNetwork } from "./adminNetwork.js";
import { attachAdminUser } from "./adminAuth.js";
import { registerAdminApiRoutes } from "./adminApiRoutes.js";
import { handleAuthError, requireAuth, requireSuperAdmin } from "./middleware.js";
import { ensureUploadDir } from "./uploads.js";
import { assertServerConfig } from "./startup.js";
assertServerConfig();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = openDb();
migrate(db);
ensureUploadDir();

const app = express();
const port = Number(process.env.APIO_ADMIN_PORT) || 7217;
const bind =
  process.env.APIO_ADMIN_BIND?.trim() ||
  (process.env.NODE_ENV === "production" ? "127.0.0.1" : "127.0.0.1");

app.set("trust proxy", 1);
applySecurityMiddleware(app);

app.use(requireAdminNetwork);

app.use(express.json({ limit: "512kb" }));
app.use(rejectPrototypePollutionMiddleware);
app.use(cookieParser());
app.use(attachAdminUser(db));

const rateLimitJson = (message) => ({
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: message, code: "RATE_LIMIT" });
  },
});

const authLimiter = rateLimit({
  ...rateLimitJson("Too many authentication attempts"),
  max: process.env.NODE_ENV === "production" ? 20 : 120,
  skipSuccessfulRequests: true,
});

const adminMutationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: "Too many admin operations", code: "RATE_LIMIT" });
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: "Too many uploads", code: "RATE_LIMIT" });
  },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "apio-admin" });
});

registerAdminApiRoutes(app, db, {
  requireAuth,
  requireSuperAdmin,
  authLimiter,
  adminMutationLimiter,
  uploadLimiter,
  handleAuthError,
});

const staticDir =
  process.env.APIO_ADMIN_STATIC_DIR?.trim() ||
  path.resolve(__dirname, "../../admin/dist");

function serveAdminSpa() {
  if (!fs.existsSync(path.join(staticDir, "index.html"))) {
    app.get("*", (_req, res) => {
      res
        .status(503)
        .type("text/plain")
        .send("APIO Admin UI is not built. Run: npm run build:admin");
    });
    return;
  }
  app.use(express.static(staticDir, { index: false, maxAge: "1h" }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

serveAdminSpa();

app.use((err, _req, res, _next) => {
  if (err?.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message || "Bad request" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(port, bind, () => {
  console.log(
    `[apio-admin] listening on http://${bind}:${port} (network guard: ${
      process.env.APIO_ADMIN_NETWORK_GUARD === "false" ? "OFF" : "ON"
    })`,
  );
});

function shutdown(signal) {
  console.log(`[apio-admin] ${signal} — closing`);
  server.close(() => {
    try {
      db.close();
    } catch {
      /* ignore */
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(`[apio-admin] Port ${port} in use on ${bind}`);
    process.exit(1);
  }
  throw err;
});
