#!/usr/bin/env python3
"""Backup infrastructure definitions and record backup metadata."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shutil
import subprocess
import tarfile
from pathlib import Path

from automation.bcdr.config import load_yaml, repo_root


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--client", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--vault", default="")
    parser.add_argument("--storage", default="")
    args = parser.parse_args()

    root = repo_root()
    cfg = load_yaml(Path(args.client))
    stamp = dt.datetime.now(dt.timezone.utc).isoformat()
    archive_dir = root / "reports" / "backups" / "artifacts"
    archive_dir.mkdir(parents=True, exist_ok=True)
    tarball = archive_dir / f"infra-{dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.tar.gz"

    with tarfile.open(tarball, "w:gz") as tar:
        for rel in ["terraform", "client.yaml", "business-continuity"]:
            path = root / rel
            if path.exists():
                tar.add(path, arcname=rel)

    vault_status = "skipped"
    if args.vault and shutil.which("az"):
        proc = subprocess.run(["az", "account", "show"], capture_output=True)
        if proc.returncode == 0:
            vault_status = "vault_referenced"

    report = {
        "status": "SUCCESS",
        "timestamp_utc": stamp,
        "recovery_vault": args.vault or None,
        "storage_account": args.storage or None,
        "infrastructure_archive": str(tarball),
        "database_backup": {
            "method": "azure_postgresql_native + pg_dump optional",
            "configured_interval_minutes": cfg.get("backup", {}).get("database_interval_minutes"),
        },
        "vault_check": vault_status,
    }
    Path(args.report).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
