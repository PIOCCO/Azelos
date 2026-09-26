const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
];

function isBlockedHostname(host) {
  const h = String(host || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (PRIVATE_HOST_PATTERNS.some((re) => re.test(h))) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
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

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, error: "Invalid imageUrl host" };
  }

  return { ok: true, value: s };
}
