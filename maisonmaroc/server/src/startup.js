const INSECURE_JWT = new Set([
  "",
  "dev-insecure-secret",
  "change-me-in-production-use-openssl-rand-hex-32",
]);

export function assertServerConfig() {
  const production = process.env.NODE_ENV === "production";
  const issues = [];

  if (production) {
    const secret = process.env.JWT_SECRET || "dev-insecure-secret";
    if (INSECURE_JWT.has(secret) || secret.length < 32) {
      issues.push("Set JWT_SECRET to a strong random string (≥32 chars) in production.");
    }
    if (process.env.SUPER_ADMIN_PASSWORD === "change-me-on-first-login") {
      issues.push("Change SUPER_ADMIN_PASSWORD before running in production.");
    }
    if (!process.env.ALLOWED_ORIGINS && !process.env.CLIENT_ORIGIN) {
      issues.push("Set ALLOWED_ORIGINS for production CORS.");
    }
    const smtpHost = process.env.SMTP_HOST?.trim();
    const emailFrom = process.env.EMAIL_FROM?.trim();
    if (!smtpHost || !emailFrom) {
      issues.push("Set SMTP_HOST and EMAIL_FROM for production email verification and password reset.");
    }
    if (!process.env.FRONTEND_URL?.trim()) {
      issues.push("Set FRONTEND_URL to the public APIO URL (e.g. https://dribex.ma/APIO).");
    }
    if (process.argv[1]?.includes("adminIndex")) {
      if (!process.env.APIO_ADMIN_JWT_SECRET?.trim() || process.env.APIO_ADMIN_JWT_SECRET.length < 32) {
        issues.push("Set APIO_ADMIN_JWT_SECRET (≥32 chars) for the APIO Admin server in production.");
      }
      if (!process.env.APIO_ADMIN_ALLOWED_NETWORKS?.trim()) {
        issues.push("Set APIO_ADMIN_ALLOWED_NETWORKS (Tailscale CIDRs) for the APIO Admin server.");
      }
    }
  } else if (!process.env.JWT_SECRET) {
    console.warn("[apio-server] Using default JWT secret — set JWT_SECRET for non-local deployments.");
  }

  if (issues.length) {
    console.error("[apio-server] Configuration problems:\n" + issues.map((i) => `  • ${i}`).join("\n"));
    if (production && process.env.STRICT_CONFIG !== "false") {
      process.exit(1);
    }
  }
}
