"""Create a demo API user with ORG_ADMIN membership for the seeded financial entity."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.rbac import Role
from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity

DEFAULT_EMAIL = "admin@demo.bank"
DEFAULT_PASSWORD = "ChangeMeNow!"


def main() -> None:
    session = SessionLocal()
    try:
        entity = session.scalar(
            select(FinancialEntity).order_by(FinancialEntity.legal_name).limit(1)
        )
        if entity is None:
            raise SystemExit("Run scripts/seed_dev.py first.")
        existing = session.scalar(select(User).where(User.email == DEFAULT_EMAIL))
        if existing:
            print(f"User already exists: {DEFAULT_EMAIL}")
            return
        user = User(
            email=DEFAULT_EMAIL,
            hashed_password=hash_password(DEFAULT_PASSWORD),
            full_name="Demo Admin",
            is_active=True,
        )
        session.add(user)
        session.flush()
        session.add(
            OrganizationMembership(
                user_id=user.id,
                financial_entity_id=entity.id,
                role=Role.ORG_ADMIN,
            )
        )
        session.commit()
        print(f"Created {DEFAULT_EMAIL} for organization {entity.legal_name}")
        print("Set a strong password in production; rotate JWT_SECRET_KEY.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
