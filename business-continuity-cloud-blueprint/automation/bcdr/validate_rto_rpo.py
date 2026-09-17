#!/usr/bin/env python3
"""Validate declared RTO/RPO against estimated architecture capability."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from automation.bcdr.config import load_yaml, repo_root


def effective_rpo_minutes(client: dict, profile_caps: dict) -> int:
    backup = client.get("backup", {})
    db_interval = int(backup.get("database_interval_minutes", 1440))
    profile_rpo = int(profile_caps.get("estimated_rpo_minutes", db_interval))
    return min(db_interval, profile_rpo)


def effective_rto_minutes(profile_caps: dict, use_failover: bool) -> int:
    if use_failover:
        return int(profile_caps.get("estimated_failover_rto_minutes", 240))
    return int(profile_caps.get("estimated_restore_rto_minutes", 240))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--client", default=str(repo_root() / "client.yaml"))
    parser.add_argument("--assets", default=str(repo_root() / "business-continuity/critical-assets.yaml"))
    parser.add_argument("--capabilities", default=str(repo_root() / "business-continuity/architecture-capabilities.yaml"))
    parser.add_argument("--json-out", default="")
    args = parser.parse_args()

    client = load_yaml(Path(args.client))
    assets = load_yaml(Path(args.assets))
    caps_doc = load_yaml(Path(args.capabilities))

    profile = client.get("cloud", {}).get("profile", "standard")
    profile_caps = caps_doc.get("profiles", {}).get(profile, {})
    if not profile_caps:
        print(f"ERROR: unknown profile '{profile}' in architecture-capabilities.yaml", file=sys.stderr)
        return 2

    est_rpo = effective_rpo_minutes(client, profile_caps)
    est_rto_restore = effective_rto_minutes(profile_caps, use_failover=False)
    est_rto_failover = effective_rto_minutes(profile_caps, use_failover=True)

    results = []
    exit_code = 0

    for svc_name, svc in (assets.get("services") or {}).items():
        declared_rto = int(svc.get("rto_minutes", client.get("business", {}).get("default_rto_minutes", 9999)))
        declared_rpo = int(svc.get("rpo_minutes", client.get("business", {}).get("default_rpo_minutes", 9999)))
        rto_est = est_rto_failover if profile_caps.get("multi_region_compute") else est_rto_restore

        rpo_ok = declared_rpo >= est_rpo
        rto_ok = declared_rto >= rto_est

        if not rpo_ok:
            exit_code = 1
        if not rto_ok:
            exit_code = 1 if exit_code != 1 else 1

        item = {
            "service": svc_name,
            "configured_target": {"rto_minutes": declared_rto, "rpo_minutes": declared_rpo},
            "estimated_capability": {
                "rto_minutes": rto_est,
                "rpo_minutes": est_rpo,
                "basis": f"profile={profile}, backup.database_interval_minutes={client.get('backup', {}).get('database_interval_minutes')}",
            },
            "tested_result": None,
            "rto_status": "PASS" if rto_ok else "FAIL",
            "rpo_status": "PASS" if rpo_ok else "FAIL",
        }
        if not rpo_ok:
            item["rpo_reason"] = (
                f"RPO TARGET NOT SATISFIED: declared {declared_rpo}m but estimated capability is {est_rpo}m "
                f"(backup interval / profile limits)."
            )
        if not rto_ok:
            item["rto_reason"] = (
                f"RTO TARGET NOT SATISFIED: declared {declared_rto}m but estimated restore/failover capability is {rto_est}m."
            )
        results.append(item)

    payload = {
        "profile": profile,
        "summary": {
            "services_evaluated": len(results),
            "rpo_failures": sum(1 for r in results if r["rpo_status"] == "FAIL"),
            "rto_failures": sum(1 for r in results if r["rto_status"] == "FAIL"),
        },
        "results": results,
        "note": "Estimated capability is not a tested result. Run scripts/recovery-test.sh for tested RTO/RPO.",
    }

    text = json.dumps(payload, indent=2)
    print(text)
    if args.json_out:
        Path(args.json_out).write_text(text + "\n", encoding="utf-8")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
