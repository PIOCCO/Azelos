#!/usr/bin/env python3
"""Emit a signed INTERNAL development license (dev key only — not for production)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.licensing.enums import LicensePlan
from app.licensing.signing import build_payload, dev_signing_private_key, sign_payload


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--organization-id", type=UUID, required=True)
    p.add_argument("--customer-name", default="Development Organization")
    p.add_argument("--days", type=int, default=365)
    args = p.parse_args()
    now = datetime.now(timezone.utc)
    payload = build_payload(
        organization_id=args.organization_id,
        customer_name=args.customer_name,
        plan=LicensePlan.INTERNAL,
        starts_at=now - timedelta(days=1),
        expires_at=now + timedelta(days=args.days),
        max_users=50,
        enabled_modules=None,
    )
    envelope = sign_payload(payload, dev_signing_private_key())
    print(json.dumps(envelope.model_dump(mode="json"), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
