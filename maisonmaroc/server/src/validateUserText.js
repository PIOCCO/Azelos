/** Server-side plain-text validation for hostile normal-user input. */

const CONTROL_OR_BIDI =
  /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]|[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/;

const PERSON_NAME_RE = /^[\p{L}\p{M}0-9 .,'\-()]+$/u;

const PHONE_RE = /^[+]?[\d\s().\-]{0,32}$/;

export function containsDisallowedControlChars(value) {
  return CONTROL_OR_BIDI.test(String(value ?? ""));
}

export function validatePlainTextField(raw, { min = 0, max, fieldName = "field" } = {}) {
  const text = String(raw ?? "").trim();
  if (text.length < min) {
    return { ok: false, error: `Invalid ${fieldName}` };
  }
  if (max !== undefined && text.length > max) {
    return { ok: false, error: `Invalid ${fieldName}` };
  }
  if (containsDisallowedControlChars(text)) {
    return { ok: false, error: `Invalid ${fieldName}` };
  }
  return { ok: true, value: text };
}

export function validatePersonName(raw) {
  const base = validatePlainTextField(raw, { min: 2, max: 120, fieldName: "name" });
  if (!base.ok) return base;
  if (!PERSON_NAME_RE.test(base.value)) {
    return { ok: false, error: "Invalid name" };
  }
  return base;
}

export function validateOptionalPhone(raw) {
  if (raw === null || raw === undefined || raw === "") {
    return { ok: true, value: null };
  }
  const phone = String(raw).trim();
  if (phone.length > 32) return { ok: false, error: "Invalid phone" };
  if (containsDisallowedControlChars(phone)) {
    return { ok: false, error: "Invalid phone" };
  }
  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: "Invalid phone" };
  }
  return { ok: true, value: phone };
}

export function validateMessagePlainText(raw) {
  const base = validatePlainTextField(raw, { min: 1, max: 5000, fieldName: "message" });
  if (!base.ok) return base;
  return base;
}

const POLLUTION_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function assertNoPrototypePollution(value, depth = 0) {
  if (depth > 32) {
    const err = new Error("Invalid request body");
    err.status = 400;
    throw err;
  }
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) assertNoPrototypePollution(item, depth + 1);
    return;
  }
  for (const key of Object.keys(value)) {
    if (POLLUTION_KEYS.has(key)) {
      const err = new Error("Invalid request body");
      err.status = 400;
      throw err;
    }
    assertNoPrototypePollution(value[key], depth + 1);
  }
}

export function rejectUnexpectedBodyKeys(body, allowedKeys, message = "Unexpected field") {
  if (!body || typeof body !== "object" || Array.isArray(body)) return;
  for (const key of Object.keys(body)) {
    if (!allowedKeys.includes(key)) {
      const err = new Error(message);
      err.status = 400;
      throw err;
    }
  }
}
