"""License signing helpers — private key must come from environment (never committed)."""

from __future__ import annotations

import base64
import hashlib
import os
from datetime import datetime, timezone
from uuid import UUID, uuid4

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

from app.licensing.crypto import canonical_payload_bytes
from app.licensing.enums import LicensePlan, LicenseStatus
from app.licensing.schema import LICENSE_FORMAT_VERSION, LicenseEnvelope, LicensePayload


DEV_SEED_MESSAGE = b"ADORA_DEV_LICENSE_SEED_v1_DO_NOT_USE_IN_PRODUCTION"


def load_signing_private_key_from_env() -> Ed25519PrivateKey:
    pem = os.getenv("ADORA_LICENSE_SIGNING_KEY_PEM", "").strip()
    if not pem:
        path = os.getenv("ADORA_LICENSE_SIGNING_KEY_FILE", "").strip()
        if path:
            pem = open(os.path.expanduser(path), encoding="utf-8").read()
    if not pem:
        raise RuntimeError(
            "Set ADORA_LICENSE_SIGNING_KEY_PEM or ADORA_LICENSE_SIGNING_KEY_FILE "
            "(private key must not be stored in the repository)."
        )
    key = serialization.load_pem_private_key(pem.encode("utf-8"), password=None)
    if not isinstance(key, Ed25519PrivateKey):
        raise RuntimeError("Signing key must be Ed25519")
    return key


def dev_signing_private_key() -> Ed25519PrivateKey:
    """Deterministic dev/test key — documented as non-production only."""
    seed = hashlib.sha256(DEV_SEED_MESSAGE).digest()
    return Ed25519PrivateKey.from_private_bytes(seed)


def sign_payload(
    payload: LicensePayload,
    private_key: Ed25519PrivateKey,
) -> LicenseEnvelope:
    message = canonical_payload_bytes(payload)
    signature = base64.urlsafe_b64encode(private_key.sign(message)).decode("ascii").rstrip("=")
    return LicenseEnvelope(format_version=LICENSE_FORMAT_VERSION, payload=payload, signature=signature)


def build_payload(
    *,
    organization_id: UUID,
    customer_name: str,
    plan: LicensePlan,
    starts_at: datetime,
    expires_at: datetime,
    max_users: int = 10,
    enabled_modules: list[str] | None = None,
    license_status: LicenseStatus = LicenseStatus.ACTIVE,
    license_id: UUID | None = None,
    product_version: str | None = "1.0.0",
) -> LicensePayload:
    now = datetime.now(timezone.utc)
    return LicensePayload(
        license_id=license_id or uuid4(),
        organization_id=organization_id,
        customer_name=customer_name,
        plan=plan,
        issued_at=now,
        starts_at=starts_at,
        expires_at=expires_at,
        max_users=max_users,
        enabled_modules=enabled_modules,
        license_status=license_status,
        product_version=product_version,
    )
