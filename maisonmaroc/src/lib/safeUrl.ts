const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Returns href if safe for user navigation; otherwise null. Blocks javascript: and open redirects. */
export function safeExternalHref(href: string | null | undefined): string | null {
  if (!href || typeof href !== "string") return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return null;
  try {
    const url = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}
