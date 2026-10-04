from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

from app.licensing.schema import LICENSE_FORMAT_VERSION, LicensePayload


def canonical_payload_bytes(payload: LicensePayload | dict[str, Any]) -> bytes:
    if isinstance(payload, LicensePayload):
        data = payload.model_dump(mode="json")
    else:
        data = payload
    if int(data.get("license_format_version", LICENSE_FORMAT_VERSION)) != LICENSE_FORMAT_VERSION:
        raise ValueError("Unsupported license_format_version")
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def canonical_revocation_list_bytes(revocations: list[dict[str, Any]], format_version: int) -> bytes:
    body = {"format_version": format_version, "revocations": revocations}
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def load_public_key(pem: str | bytes) -> Ed25519PublicKey:
    if isinstance(pem, str):
        pem = pem.encode("utf-8")
    key = serialization.load_pem_public_key(pem)
    if not isinstance(key, Ed25519PublicKey):
        raise ValueError("License public key must be Ed25519")
    return key


def load_public_key_from_file(path: Path) -> Ed25519PublicKey:
    return load_public_key(path.read_bytes())


def verify_signature(public_key: Ed25519PublicKey, message: bytes, signature_b64: str) -> None:
    try:
        sig = base64.urlsafe_b64decode(signature_b64 + "==="[: (4 - len(signature_b64) % 4) % 4])
    except Exception as exc:
        raise ValueError("Invalid signature encoding") from exc
    try:
        public_key.verify(sig, message)
    except InvalidSignature as exc:
        raise ValueError("Invalid license signature") from exc


def default_public_key_path() -> Path:
    return Path(__file__).resolve().parent / "public_key.pem"
