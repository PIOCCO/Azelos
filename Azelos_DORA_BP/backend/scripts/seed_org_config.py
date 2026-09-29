"""Enable default modules for Demo European Bank (run after seed_dev.py)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.financial_entity import FinancialEntity
from app.models.platform_config import OrganizationModule, PlatformModule

DEFAULT_MODULE_KEYS = (
    "THIRD_PARTY_RISK",
    "ICT_RISK",
    "EVIDENCE_MANAGEMENT",
    "AUDIT",
)


def main() -> None:
    session = SessionLocal()
    try:
        bank = session.scalar(
            select(FinancialEntity).where(FinancialEntity.legal_name == "Demo European Bank")
        )
        if bank is None:
            print("Demo European Bank not found — run seed_dev.py first.")
            return
        modules = {
            m.key: m
            for m in session.scalars(select(PlatformModule)).all()
        }
        for key in DEFAULT_MODULE_KEYS:
            mod = modules.get(key)
            if mod is None:
                continue
            exists = session.scalar(
                select(OrganizationModule).where(
                    OrganizationModule.financial_entity_id == bank.id,
                    OrganizationModule.platform_module_id == mod.id,
                )
            )
            if exists:
                exists.enabled = True
            else:
                session.add(
                    OrganizationModule(
                        financial_entity_id=bank.id,
                        platform_module_id=mod.id,
                        enabled=True,
                    )
                )
        session.commit()
        print("Organization default modules configured.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
