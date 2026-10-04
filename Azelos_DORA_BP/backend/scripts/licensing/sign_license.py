#!/usr/bin/env python3
"""Sign an ADORA license envelope (licensing authority — run outside customer deployments)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

# Allow running from repo: python scripts/licensing/sign_license.py
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.licensing.enums import LicensePlan, LicenseStatus
from app.licensing.signing import build_payload, load_signing_private_key_from_env, sign_payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Sign an ADORA license (Ed25519)")
    parser.add_argument("--organization-id", required=True, type=UUID)
    parser.add_argument("--customer-name", required=True)
    parser.add_argument("--plan", choices=[p.value for p in LicensePlan], default="PILOT")
    parser.add_argument("--starts-at", required=True, help="ISO-8601 UTC")
    parser.add_argument("--expires-at", required=True, help="ISO-8601 UTC")
    parser.add_argument("--max-users", type=int, default=10)
    parser.add_argument("--modules", nargs="*", default=None, help="Enabled module keys (omit = all)")
    parser.add_argument(
        "--status",
        choices=[s.value for s in LicenseStatus],
        default=LicenseStatus.ACTIVE.value,
    )
    parser.add_argument("--license-id", type=UUID, default=None)
    parser.add_argument("--out", type=Path, default=None, help="Write JSON envelope to file")
    args = parser.parse_args()

    payload = build_payload(
        organization_id=args.organization_id,
        customer_name=args.customer_name,
        plan=LicensePlan(args.plan),
        starts_at=datetime.fromisoformat(args.starts_at.replace("Z", "+00:00")),
        expires_at=datetime.fromisoformat(args.expires_at.replace("Z", "+00:00")),
        max_users=args.max_users,
        enabled_modules=args.modules,
        license_status=LicenseStatus(args.status),
        license_id=args.license_id,
    )
    envelope = sign_payload(payload, load_signing_private_key_from_env())
    text = json.dumps(envelope.model_dump(mode="json"), indent=2)
    if args.out:
        args.out.write_text(text + "\n", encoding="utf-8")
        print(f"Wrote {args.out}")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
