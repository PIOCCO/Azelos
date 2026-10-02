"""Encrypt integration credentials at rest (application layer)."""

from __future__ import annotations

import base64
import hashlib
import json
import os
from typing import Any

from cryptography.fernet import Fernet, InvalidToken


class IntegrationSecretsError(RuntimeError):
    pass


def _fernet_key_material() -> bytes:
    explicit = os.getenv("INTEGRATION_SECRETS_KEY", "").strip()
    material = explicit or os.getenv("JWT_SECRET_KEY", "").strip()
    if len(material) < 32:
        raise IntegrationSecretsError(
            "Set INTEGRATION_SECRETS_KEY or JWT_SECRET_KEY (32+ chars) to store integration credentials."
        )
    return base64.urlsafe_b64encode(hashlib.sha256(material.encode()).digest())


def encrypt_secrets(payload: dict[str, Any]) -> bytes:
    token = Fernet(_fernet_key_material()).encrypt(json.dumps(payload).encode("utf-8"))
    return token


def decrypt_secrets(blob: bytes) -> dict[str, Any]:
    try:
        raw = Fernet(_fernet_key_material()).decrypt(blob)
    except InvalidToken as exc:
        raise IntegrationSecretsError("Unable to decrypt integration credentials.") from exc
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise IntegrationSecretsError("Invalid secrets payload.")
    return data
