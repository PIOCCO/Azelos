from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.licensing.enums import LicensePlan, LicenseStatus
from app.licensing.schema import LicenseEnvelope
from app.licensing.signing import build_payload, dev_signing_private_key, sign_payload


def make_signed_envelope(
    organization_id: UUID,
    *,
    days_valid: int = 90,
    days_offset: int = 0,
    max_users: int = 10,
    enabled_modules: list[str] | None = None,
    license_status: LicenseStatus = LicenseStatus.ACTIVE,
    plan: LicensePlan = LicensePlan.INTERNAL,
) -> LicenseEnvelope:
    now = datetime.now(timezone.utc)
    starts = now + timedelta(days=days_offset)
    expires = starts + timedelta(days=days_valid)
    payload = build_payload(
        organization_id=organization_id,
        customer_name="Test Customer",
        plan=plan,
        starts_at=starts,
        expires_at=expires,
        max_users=max_users,
        enabled_modules=enabled_modules,
        license_status=license_status,
    )
    return sign_payload(payload, dev_signing_private_key())
