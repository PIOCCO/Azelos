/** Structured security events (never log secrets, passwords, or tokens). */
export function logSecurityEvent(event, details = {}) {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...details,
  };
  console.warn("[apio-security]", JSON.stringify(payload));
}
