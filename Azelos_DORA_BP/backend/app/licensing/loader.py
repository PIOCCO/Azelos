from __future__ import annotations

import base64
import json
import os
from pathlib import Path

from app.licensing.schema import LicenseEnvelope, RevocationListEnvelope


def load_license_envelope_from_env() -> LicenseEnvelope | None:
    raw = os.getenv("ADORA_LICENSE", "").strip()
    if not raw:
        path = os.getenv("ADORA_LICENSE_FILE", "").strip()
        if path:
            raw = Path(path).read_text(encoding="utf-8").strip()
    if not raw:
        return None
    if not raw.startswith("{"):
        raw = base64.urlsafe_b64decode(raw + "==="[: (4 - len(raw) % 4) % 4]).decode("utf-8")
    data = json.loads(raw)
    return LicenseEnvelope.model_validate(data)


def load_revocation_envelope_from_env() -> RevocationListEnvelope | None:
    raw = os.getenv("ADORA_LICENSE_REVOCATIONS", "").strip()
    if not raw:
        path = os.getenv("ADORA_LICENSE_REVOCATIONS_FILE", "").strip()
        if path:
            raw = Path(path).read_text(encoding="utf-8").strip()
    if not raw:
        return None
    if not raw.startswith("{"):
        raw = base64.urlsafe_b64decode(raw + "==="[: (4 - len(raw) % 4) % 4]).decode("utf-8")
    data = json.loads(raw)
    return RevocationListEnvelope.model_validate(data)
