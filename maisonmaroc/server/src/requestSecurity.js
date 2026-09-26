import { isProduction } from "./security.js";
import { assertNoPrototypePollution } from "./validateUserText.js";
import { logSecurityEvent } from "./securityLog.js";

function hostFromHeader(value) {
  if (!value) return "";
  const first = String(value).split(",")[0].trim();
  const withoutPort = first.replace(/:\d+$/, "");
  return withoutPort.toLowerCase().replace(/^\[|\]$/g, "");
}

function allowedHostsFromEnv() {
  const hosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  const fromOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const origin of fromOrigins) {
    try {
      hosts.add(new URL(origin).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  const extra = (process.env.TRUSTED_HOSTS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const h of extra) hosts.add(h);
  return hosts;
}

/** Reject Host header spoofing in production (URL generation / cache poisoning). */
export function trustedHostMiddleware(req, res, next) {
  if (!isProduction()) return next();
  const allowed = allowedHostsFromEnv();
  const host = hostFromHeader(req.headers.host);
  if (!host || !allowed.has(host)) {
    logSecurityEvent("blocked_host", { host, ip: req.ip, path: req.path });
    return res.status(400).json({ error: "Bad request" });
  }
  next();
}

/** Deep-scan JSON bodies for prototype pollution keys. */
export function rejectPrototypePollutionMiddleware(req, _res, next) {
  try {
    if (req.body && typeof req.body === "object") {
      assertNoPrototypePollution(req.body);
    }
  } catch (err) {
    err.status = err.status || 400;
    return next(err);
  }
  next();
}
