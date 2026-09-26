const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^::$/,
  /^fc00:/i,
  /^fd[0-9a-f]{0,2}:/i,
  /^fe80:/i,
];

const BLOCKED_HOST_NAMES = new Set([
  "metadata.google.internal",
  "metadata.google",
  "kubernetes.default.svc",
  "redis",
  "postgres",
  "postgresql",
  "minio",
  "grafana",
  "prometheus",
  "loki",
  "docker",
  "host.docker.internal",
]);

function ipv4FromDecimalHost(host) {
  const h = String(host || "").trim();
  if (!/^\d+$/.test(h)) return null;
  const n = Number(h);
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) return null;
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function isPrivateIpv4Octets(a, b) {
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isBlockedIpv4Literal(host) {
  const parts = String(host).split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return false;
  }
  return isPrivateIpv4Octets(parts[0], parts[1]);
}

function isBlockedHostname(host) {
  const h = String(host || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (PRIVATE_HOST_PATTERNS.some((re) => re.test(h))) return true;
  if (BLOCKED_HOST_NAMES.has(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return true;
  if (h.includes("metadata") && (h.includes("google") || h.includes("aws"))) return true;
  const decimalIp = ipv4FromDecimalHost(h);
  if (decimalIp && isBlockedIpv4Literal(decimalIp)) return true;
  if (isBlockedIpv4Literal(h)) return true;
  return false;
}

/**
 * Optional https (or http in non-production) media URL for news/events — blocks SSRF schemes and private hosts.
 */
export function validateExternalMediaUrl(raw) {
  if (raw === null || raw === undefined || raw === "") {
    return { ok: true, value: null };
  }
  const s = String(raw).trim();
  if (!s) return { ok: true, value: null };
  if (s.length > 2000) return { ok: false, error: "Invalid imageUrl" };
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(s)) return { ok: false, error: "Invalid imageUrl" };

  let parsed;
  try {
    parsed = new URL(s);
  } catch {
    return { ok: false, error: "Invalid imageUrl" };
  }

  const proto = parsed.protocol.toLowerCase();
  const production = process.env.NODE_ENV === "production";
  if (proto === "https:") {
    /* allowed */
  } else if (!production && proto === "http:") {
    /* dev only */
  } else {
    return { ok: false, error: "Invalid imageUrl scheme" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "Invalid imageUrl" };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, error: "Invalid imageUrl host" };
  }

  return { ok: true, value: s };
}
