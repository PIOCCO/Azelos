const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactBody(body) {
  const errors = [];
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = body?.phone ? String(body.phone).trim() : "";
  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();

  if (firstName.length < 2 || firstName.length > 80) errors.push("Invalid first name");
  if (lastName.length < 2 || lastName.length > 80) errors.push("Invalid last name");
  if (!EMAIL_RE.test(email) || email.length > 254) errors.push("Invalid email");
  if (phone.length > 32) errors.push("Invalid phone");
  if (subject.length < 3 || subject.length > 200) errors.push("Invalid subject");
  if (message.length < 10 || message.length > 5000) errors.push("Invalid message");

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: { firstName, lastName, email, phone: phone || null, subject, message },
  };
}
