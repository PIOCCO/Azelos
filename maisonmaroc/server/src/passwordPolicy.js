const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export function validatePasswordPolicy(password) {
  const p = String(password ?? "");
  if (p.length < MIN_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_LENGTH} characters` };
  }
  if (p.length > MAX_LENGTH) {
    return { ok: false, error: "Password is too long" };
  }
  return { ok: true };
}
