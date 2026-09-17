#!/usr/bin/env python3
"""Generate Business Continuity readiness scorecard (PASS/WARNING/FAIL)."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

from automation.bcdr.config import load_yaml, repo_root


def run_validation() -> tuple[dict, int]:
    proc = subprocess.run(
        [sys.executable, str(repo_root() / "automation/bcdr/validate_rto_rpo.py"), "--json-out", "/tmp/rto-rpo.json"],
        capture_output=True,
        text=True,
    )
    try:
        data = json.loads(proc.stdout or "{}")
    except json.JSONDecodeError:
        data = {"summary": {"rpo_failures": 1, "rto_failures": 1}}
    return data, proc.returncode


def control(name: str, status: str, reason: str) -> dict:
    return {"control": name, "status": status, "reason": reason}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(repo_root() / "readiness-report.json"))
    args = parser.parse_args()

    root = repo_root()
    client_path = root / "client.yaml"
    client = load_yaml(client_path)

    controls: list[dict] = []

    # Backup
    backup_dir = root / "reports" / "backups"
    backup_reports = sorted(backup_dir.glob("backup-*.json")) if backup_dir.exists() else []
    if backup_reports:
        controls.append(control("Backup", "PASS", f"Latest report: {backup_reports[-1].name}"))
    else:
        controls.append(control("Backup", "WARNING", "No backup reports found under reports/backups/"))

    # Restore
    restore_dir = root / "reports" / "restore"
    if restore_dir.exists() and any(restore_dir.glob("restore-*.json")):
        controls.append(control("Restore", "PASS", "Restore reports present"))
    else:
        controls.append(control("Restore", "WARNING", "No restore reports yet — run scripts/restore.sh"))

    validation, val_rc = run_validation()
    rpo_fail = validation.get("summary", {}).get("rpo_failures", 0)
    rto_fail = validation.get("summary", {}).get("rto_failures", 0)

    if rpo_fail:
        controls.append(control("RPO validation", "FAIL", f"{rpo_fail} service(s) exceed estimated backup/profile RPO capability"))
    else:
        controls.append(control("RPO validation", "PASS", "Declared RPO within estimated capability"))

    if rto_fail:
        controls.append(control("RTO validation", "WARNING" if rpo_fail == 0 else "FAIL", f"{rto_fail} service(s) exceed estimated RTO capability"))
    else:
        controls.append(control("RTO validation", "PASS", "Declared RTO within estimated capability"))

    # Failover / failback — based on last drill reports
    failover_report = root / "reports" / "failover-last.json"
    if failover_report.exists():
        controls.append(control("Failover", "PASS", "Failover report archived"))
    else:
        controls.append(control("Failover", "WARNING", "No failover drill report — run scripts/failover.sh --dry-run"))

    failback_report = root / "reports" / "failback-last.json"
    if failback_report.exists():
        controls.append(control("Failback", "PASS", "Failback report archived"))
    else:
        controls.append(control("Failback", "WARNING", "No failback drill report"))

    if client.get("monitoring", {}).get("enable_backup_alerts", True):
        controls.append(control("Monitoring", "PASS", "Backup/DR alerts enabled in client.yaml"))
    else:
        controls.append(control("Monitoring", "WARNING", "Backup alerts disabled in configuration"))

    rt_path = root / "recovery-test-report.json"
    if rt_path.exists():
        rt = json.loads(rt_path.read_text(encoding="utf-8"))
        st = rt.get("outcome", "UNKNOWN")
        controls.append(control("Recovery test", st if st in {"PASS", "FAIL", "WARNING"} else "WARNING", rt.get("summary", "See recovery-test-report.json")))
    else:
        controls.append(control("Recovery test", "WARNING", "recovery-test-report.json not found"))

    report = {
        "title": "BUSINESS CONTINUITY READINESS",
        "controls": controls,
        "validation_exit_code": val_rc,
    }

    out = Path(args.output)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(report["title"])
    for c in controls:
        print(f"{c['control']}\n{c['status']}\n  {c['reason']}\n")

    worst = 0
    for c in controls:
        if c["status"] == "FAIL":
            worst = 2
        elif c["status"] == "WARNING" and worst < 1:
            worst = 1
    return worst


if __name__ == "__main__":
    sys.exit(main())
