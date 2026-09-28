#!/usr/bin/env python3
"""Database preflight: connectivity, version, migration state, SSL hint."""

from __future__ import annotations

import re
import sys

from sqlalchemy import text

from app.config.database import MIN_POSTGRESQL_MAJOR, load_database_settings
from app.database.engine import get_engine, reset_engine


def _parse_major(version_string: str) -> int | None:
    match = re.search(r"PostgreSQL\s+(\d+)", version_string)
    if match:
        return int(match.group(1))
    match = re.search(r"(\d+)\.", version_string)
    return int(match.group(1)) if match else None


def main() -> int:
    lines: list[str] = []
    try:
        settings = load_database_settings()
    except Exception as exc:
        print(f"Database configuration: FAIL ({exc})")
        return 1

    reset_engine()
    engine = get_engine(settings=settings)

    try:
        with engine.connect() as conn:
            lines.append("Database connection: OK")
            version_row = conn.execute(text("SELECT version()")).scalar_one()
            major = _parse_major(version_row)
            if major is None:
                lines.append("PostgreSQL version: UNKNOWN")
            elif major < MIN_POSTGRESQL_MAJOR:
                lines.append(
                    f"PostgreSQL version: {major}.x (FAIL — require {MIN_POSTGRESQL_MAJOR}+)"
                )
                print("\n".join(lines))
                return 1
            else:
                lines.append(f"PostgreSQL version: {major}.x")

            conn.execute(text("SELECT 1"))
            lines.append("Database accessible: OK")

            user = conn.execute(text("SELECT current_user")).scalar_one()
            lines.append(f"Database user: {user}")

            can_create = conn.execute(
                text("SELECT has_database_privilege(current_user, current_database(), 'CREATE')")
            ).scalar_one()
            lines.append(
                "CREATE privilege: OK" if can_create else "CREATE privilege: not granted (may be OK for app role)"
            )

            alembic_row = conn.execute(
                text(
                    "SELECT version_num FROM alembic_version ORDER BY version_num DESC LIMIT 1"
                )
            ).first()
            if alembic_row:
                lines.append(f"Migration state: OK (revision {alembic_row[0]})")
            else:
                lines.append("Migration state: no alembic_version row (run alembic upgrade head)")

    except Exception as exc:
        print(f"Database connection: FAIL ({type(exc).__name__})")
        return 1
    finally:
        engine.dispose()
        reset_engine()

    if settings.ssl_mode:
        lines.append(f"SSL: configured (sslmode={settings.ssl_mode})")
    else:
        lines.append("SSL: not configured via DB_SSL_MODE")

    lines.append(f"Connection target: {settings.masked_url()}")
    lines.append("Database preflight: PASS")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
