"""One-time platform operator account (SUPER_ADMIN) for tenant provisioning.

Not used by customer tenants. Run after migrations in each new environment:

  cd backend && source .venv/bin/activate
  export DATABASE_URL=...
  python scripts/bootstrap_platform_operator.py \\
    --email operator@your-company.example \\
    --password 'UseAStrongPassword12!'

Password can also be set via OPERATOR_PASSWORD env (avoid shell history).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.database.session import SessionLocal
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity

PLATFORM_ORG_NAME = "Azelos Platform Operations"


def main() -> None:
    parser = argparse.ArgumentParser(description="Create SUPER_ADMIN platform operator")
    parser.add_argument("--email", required=True, help="Operator login email")
    parser.add_argument(
        "--password",
        default=os.environ.get("OPERATOR_PASSWORD"),
        help="Initial password (min 12 chars) or OPERATOR_PASSWORD env",
    )
    args = parser.parse_args()
    if not args.password or len(args.password) < 12:
        raise SystemExit("Provide --password or OPERATOR_PASSWORD (min 12 characters).")

    session = SessionLocal()
    try:
        user = session.scalar(select(User).where(User.email == args.email))
        if user is not None:
            mem = session.scalar(
                select(OrganizationMembership).where(OrganizationMembership.user_id == user.id)
            )
            if mem and mem.role == Role.SUPER_ADMIN:
                print(f"SUPER_ADMIN already exists: {args.email}")
                return
            raise SystemExit(f"User {args.email} exists but is not SUPER_ADMIN — resolve manually.")

        org = session.scalar(
            select(FinancialEntity).where(FinancialEntity.legal_name == PLATFORM_ORG_NAME)
        )
        if org is None:
            org = FinancialEntity(
                legal_name=PLATFORM_ORG_NAME,
                short_name="Platform",
                country_code="DE",
                status="active",
            )
            session.add(org)
            session.flush()

        user = User(
            email=args.email,
            hashed_password=hash_password(args.password),
            full_name="Platform Operator",
            is_active=True,
        )
        session.add(user)
        session.flush()
        session.add(
            OrganizationMembership(
                user_id=user.id,
                financial_entity_id=org.id,
                role=Role.SUPER_ADMIN,
            )
        )
        session.commit()
        print(f"Created SUPER_ADMIN {args.email} (organization: {PLATFORM_ORG_NAME}).")
        print("Use Admin → Provision customer organization or POST /api/v1/tenant/provision.")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
