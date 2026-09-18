#!/usr/bin/env python3
"""Run discovery sync for configured tenants (Container Apps Job / cron)."""

import os
import sys

sys.path.insert(0, "/app/backend")
sys.path.insert(0, "/app")

from app.db.session import SessionLocal, init_db
from app.services.sync_engine import run_full_sync


def main() -> None:
    init_db()
    tenant_ids = [t.strip() for t in os.getenv("SYNC_TENANT_IDS", "tenant-demo").split(",") if t.strip()]
    db = SessionLocal()
    try:
        for tid in tenant_ids:
            run_full_sync(db, tid)
            print(f"sync completed for {tid}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
