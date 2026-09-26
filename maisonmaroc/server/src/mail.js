import nodemailer from "nodemailer";

/** @type {{ to: string; subject: string; text: string; html: string }[]} */
let testOutbox = [];

export function clearTestOutbox() {
  testOutbox = [];
}

export function getTestOutbox() {
  return [...testOutbox];
}

export function isEmailConfigured() {
  if (process.env.SMTP_TEST_MODE === "capture" && process.env.NODE_ENV !== "production") {
    return true;
  }
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  return Boolean(host && from);
}

export function getEmailConfigStatus() {
  return {
    configured: isEmailConfigured(),
    smtpHost: process.env.SMTP_HOST ? "[set]" : null,
    emailFrom: process.env.EMAIL_FROM ? "[set]" : null,
    missing: [
      !process.env.SMTP_HOST?.trim() && "SMTP_HOST",
      !process.env.EMAIL_FROM?.trim() && "EMAIL_FROM",
    ].filter(Boolean),
  };
}

function createTransport() {
  if (process.env.SMTP_TEST_MODE === "capture" && process.env.NODE_ENV !== "production") {
    return {
      sendMail: async (opts) => {
        testOutbox.push({
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        });
        return { messageId: "test-capture" };
      },
    };
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port,
    secure,
    auth: user ? { user, pass } : undefined,
    connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS) || 15000,
    greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS) || 15000,
  });
}

let transport = null;

function getTransport() {
  if (!transport) transport = createTransport();
  return transport;
}

export async function sendEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    const err = new Error("Email delivery is not configured");
    err.status = 503;
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "APIO";
  const from = `"${fromName}" <${process.env.EMAIL_FROM.trim()}>`;

  try {
    await getTransport().sendMail({ from, to, subject, text, html });
  } catch (e) {
    console.error("[apio-mail] send failed:", e.message);
    const err = new Error("Unable to send email");
    err.status = 503;
    throw err;
  }
}

export function publicAppUrl(path = "") {
  const base = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
