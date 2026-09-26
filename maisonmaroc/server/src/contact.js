import {
  validateOptionalPhone,
  validatePersonName,
  validatePlainTextField,
  rejectUnexpectedBodyKeys,
} from "./validateUserText.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_KEYS = ["firstName", "lastName", "email", "phone", "subject", "message"];

export function validateContactBody(body) {
  const errors = [];
  try {
    rejectUnexpectedBodyKeys(body, CONTACT_KEYS, "Unexpected field");
  } catch {
    return { ok: false, errors: ["Unexpected field"] };
  }

  const first = validatePersonName(body?.firstName);
  if (!first.ok) errors.push("Invalid first name");
  const last = validatePersonName(body?.lastName);
  if (!last.ok) errors.push("Invalid last name");

  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) errors.push("Invalid email");

  const phoneCheck = validateOptionalPhone(body?.phone);
  if (!phoneCheck.ok) errors.push("Invalid phone");

  const subjectCheck = validatePlainTextField(
    String(body?.subject ?? "").replace(/[\r\n]+/g, " "),
    { min: 3, max: 200, fieldName: "subject" },
  );
  if (!subjectCheck.ok) errors.push("Invalid subject");

  const messageCheck = validatePlainTextField(body?.message, {
    min: 10,
    max: 5000,
    fieldName: "message",
  });
  if (!messageCheck.ok) errors.push("Invalid message");

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      firstName: first.value,
      lastName: last.value,
      email,
      phone: phoneCheck.value,
      subject: subjectCheck.value,
      message: messageCheck.value,
    },
  };
}
