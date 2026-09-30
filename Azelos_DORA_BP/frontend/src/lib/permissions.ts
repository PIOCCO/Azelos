import type { Role } from "../api/types";

const rank: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ORG_ADMIN: 80,
  RISK_MANAGER: 60,
  SECURITY_MANAGER: 60,
  BUSINESS_CONTINUITY_MANAGER: 60,
  AUDITOR: 40,
  USER: 10,
};

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return (rank[role] ?? 0) >= (rank[minimum] ?? 0);
}

/** UI-only; backend enforces authorization. */
export function can(role: Role | undefined, action: string): boolean {
  if (!role) return false;
  switch (action) {
    case "org.admin":
      return roleAtLeast(role, "ORG_ADMIN");
    case "security.write":
      return roleAtLeast(role, "SECURITY_MANAGER");
    case "risk.write":
      return roleAtLeast(role, "RISK_MANAGER");
    case "read":
      return roleAtLeast(role, "USER");
    case "auditor.readonly":
      return roleAtLeast(role, "AUDITOR");
    default:
      return false;
  }
}

export function isReadOnlyAuditor(role: Role | undefined): boolean {
  return role === "AUDITOR";
}
