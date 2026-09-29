"""Role definitions and permission checks."""

import enum


class Role(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    RISK_MANAGER = "RISK_MANAGER"
    SECURITY_MANAGER = "SECURITY_MANAGER"
    BUSINESS_CONTINUITY_MANAGER = "BUSINESS_CONTINUITY_MANAGER"
    AUDITOR = "AUDITOR"
    USER = "USER"


ROLE_HIERARCHY = {
    Role.SUPER_ADMIN: 100,
    Role.ORG_ADMIN: 80,
    Role.RISK_MANAGER: 60,
    Role.SECURITY_MANAGER: 60,
    Role.BUSINESS_CONTINUITY_MANAGER: 60,
    Role.AUDITOR: 40,
    Role.USER: 10,
}


def role_at_least(role: Role, minimum: Role) -> bool:
    return ROLE_HIERARCHY.get(role, 0) >= ROLE_HIERARCHY.get(minimum, 0)
