import enum


class LicensePlan(str, enum.Enum):
    PILOT = "PILOT"
    ANNUAL = "ANNUAL"
    INTERNAL = "INTERNAL"


class LicenseStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRING = "EXPIRING"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"
    REVOKED = "REVOKED"


class LicenseAccessMode(str, enum.Enum):
    """Runtime enforcement mode (derived from signed payload + clock)."""

    FULL = "full"
    READ_ONLY = "read_only"
    NOT_STARTED = "not_started"
    UNLICENSED = "unlicensed"
    BLOCKED = "blocked"
