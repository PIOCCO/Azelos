"""Detect ORM/DB schema drift (pending Alembic revisions)."""

from __future__ import annotations

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session


def alembic_head_revision() -> str | None:
    ini = Path(__file__).resolve().parents[2] / "alembic.ini"
    if not ini.is_file():
        return None
    script = ScriptDirectory.from_config(Config(str(ini)))
    return script.get_current_head()


def current_db_revision(db: Session) -> str | None:
    try:
        return db.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).scalar()
    except Exception:
        return None


def risk_lifecycle_columns_present(db: Session) -> bool:
    """ORM expects migration 009 risk lifecycle columns."""
    bind = db.get_bind()
    inspector = inspect(bind)
    try:
        cols = {c["name"] for c in inspector.get_columns("risk_assessments")}
    except Exception:
        return False
    required = {"title", "lifecycle_status", "inherent_risk_level", "residual_risk_level"}
    return required.issubset(cols)


def repair_risk_lifecycle_columns(db: Session) -> bool:
    """Idempotent SQL repair when Alembic 009 did not run (adds missing columns)."""
    if risk_lifecycle_columns_present(db):
        return True
    bind = db.get_bind()
    stmts = [
        """
        DO $$ BEGIN
            CREATE TYPE risk_lifecycle_status AS ENUM (
                'identification', 'assessment', 'treatment', 'monitoring',
                'accepted', 'mitigated', 'review'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        "ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS title VARCHAR(512)",
        "ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS owner VARCHAR(256)",
        "ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS treatment_plan TEXT",
        "ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS due_date DATE",
        """
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS likelihood risk_dimension_level
        """,
        """
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS impact risk_dimension_level
        """,
        """
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS inherent_risk_level risk_level
        """,
        """
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS residual_risk_level risk_level
        """,
        """
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS lifecycle_status risk_lifecycle_status
        NOT NULL DEFAULT 'assessment'
        """,
        """
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ
        """,
    ]
    try:
        with bind.begin() as conn:
            for stmt in stmts:
                conn.execute(text(stmt))
    except Exception:
        return False
    return risk_lifecycle_columns_present(db)


def schema_migration_status(db: Session) -> dict:
    head = alembic_head_revision()
    current = current_db_revision(db)
    risk_ok = risk_lifecycle_columns_present(db)
    pending = head is not None and current != head
    return {
        "alembic_current": current,
        "alembic_head": head,
        "pending_migrations": pending,
        "risk_lifecycle_columns_ok": risk_ok,
        "ok": not pending and risk_ok,
        "fix_hint": (
            "Run: cd backend && python -m alembic upgrade head"
            if pending or not risk_ok
            else None
        ),
    }
