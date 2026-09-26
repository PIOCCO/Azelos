import { logSecurityEvent } from "./securityLog.js";

function parseIpv4(ip) {
  const parts = String(ip).trim().split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return parts;
}

function ipv4InCidr(ip, cidr) {
  const [base, bitsStr] = String(cidr).split("/");
  const bits = bitsStr === undefined ? 32 : parseInt(bitsStr, 10);
  if (Number.isNaN(bits) || bits < 0 || bits > 32) return false;
  const ipParts = parseIpv4(ip);
  const baseParts = parseIpv4(base);
  if (!ipParts || !baseParts) return false;
  const ipNum =
    ((ipParts[0] << 24) >>> 0) +
    (ipParts[1] << 16) +
    (ipParts[2] << 8) +
    ipParts[3];
  const baseNum =
    ((baseParts[0] << 24) >>> 0) +
    (baseParts[1] << 16) +
    (baseParts[2] << 8) +
    baseParts[3];
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipNum & mask) === (baseNum & mask);
}

function normalizeIpv6(ip) {
  return String(ip || "").toLowerCase().replace(/^\[|\]$/g, "");
}

function ipv6Exact(ip, allowed) {
  return normalizeIpv6(ip) === normalizeIpv6(allowed);
}

export function parseAdminAllowedNetworks() {
  const raw =
    process.env.APIO_ADMIN_ALLOWED_NETWORKS ||
    process.env.ADMIN_ALLOWED_NETWORKS ||
    "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function resolveClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "";
}

export function isClientIpAllowed(ip, networks) {
  if (!networks.length) return false;
  const normalized = String(ip || "").replace(/^::ffff:/, "");
  for (const net of networks) {
    if (net.includes(":")) {
      if (net.includes("/")) {
        /* IPv6 CIDR — exact match fallback for /128 and ::1/128 */
        const [base, bits] = net.split("/");
        if (bits === "128" && ipv6Exact(normalized, base)) return true;
        continue;
      }
      if (ipv6Exact(normalized, net)) return true;
      continue;
    }
    if (net.includes("/")) {
      if (ipv4InCidr(normalized, net)) return true;
    } else if (normalized === net) {
      return true;
    }
  }
  return false;
}

/**
 * Tailscale / internal network guard for the APIO Admin listener.
 * Set APIO_ADMIN_NETWORK_GUARD=false only for local automated tests.
 */
export function requireAdminNetwork(req, res, next) {
  if (process.env.APIO_ADMIN_NETWORK_GUARD === "false") return next();

  const networks = parseAdminAllowedNetworks();
  if (!networks.length) {
    logSecurityEvent("admin_network_misconfigured", { path: req.path, ip: resolveClientIp(req) });
    return res.status(503).json({ error: "Admin access is not configured" });
  }

  const ip = resolveClientIp(req);
  if (!isClientIpAllowed(ip, networks)) {
    logSecurityEvent("admin_network_denied", { path: req.path, ip });
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
