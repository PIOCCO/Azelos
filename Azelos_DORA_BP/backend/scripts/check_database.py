#!/usr/bin/env python3
"""Database preflight: connectivity, version, migration state, SSL hint."""

from __future__ import annotations

import re
import sys

from sqlalchemy import text

from app.config.database import MIN_POSTGRESQL_MAJOR, load_database_settings
from app.database.engine import get_engine, reset_engine


def _connection_hint(message: str) -> str | None:
    m = message.lower()
    if "connection refused" in m or "could not connect" in m:
        return "Hint: Postgres not reachable — is Docker up? Try port 5433 for compose (127.0.0.1:5433)."
    if "password authentication failed" in m:
        return "Hint: Wrong password in DATABASE_URL — match POSTGRES_PASSWORD in docker-compose.yml."
    if "does not exist" in m and "database" in m:
        return "Hint: Database name wrong — compose default is dora_supplier_risk."
    if "timeout" in m:
        return "Hint: Network/firewall or wrong host/port."
    if "ssl" in m or "certificate" in m:
        return "Hint: Try unsetting DB_SSL_MODE for local Docker, or set DB_SSL_MODE=require for managed Postgres."
    return None


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
        print(f"Connection target: {settings.masked_url()}")
        detail = str(exc).strip()
        if detail:
            print(f"Detail: {detail}")
        hint = _connection_hint(detail)
        if hint:
            print(hint)
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
