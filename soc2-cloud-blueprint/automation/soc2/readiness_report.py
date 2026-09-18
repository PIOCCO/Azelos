#!/usr/bin/env python3
"""SOC 2 readiness scorecard — explicit states, no fake compliance claim."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from automation.soc2.paths import repo_root


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config/clients/example.yaml")
    parser.add_argument("--output", default="readiness-report.json")
    args = parser.parse_args()

    root = repo_root()
    gap_path = root / "gap-analysis.json"
    subprocess.run(
        [sys.executable, str(root / "automation/soc2/gap_analysis.py"), "--config", args.config, "--output", str(gap_path), "--mock"],
        cwd=root,
        env={**__import__("os").environ, "PYTHONPATH": str(root)},
        check=False,
    )
    gap = json.loads(gap_path.read_text(encoding="utf-8")) if gap_path.exists() else {"results": []}

    sections = []
    for r in gap.get("results", []):
        sections.append(
            {
                "control_id": r.get("control_id"),
                "status": r.get("status"),
                "control_operating": r.get("control_operating"),
                "evidence_sufficient": r.get("evidence_sufficient", False),
                "reason": r.get("detail", ""),
            }
        )

    report = {
        "title": "SOC 2 READINESS (NOT A SOC 2 REPORT)",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "summary": gap.get("summary", {}),
        "criteria_in_scope": gap.get("criteria_in_scope", []),
        "controls": sections,
        "disclaimer": gap.get("disclaimer"),
    }

    out = root / args.output
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(report["title"])
    for s in sections:
        print(f"{s['control_id']}: {s['status']} — {s.get('reason', '')[:80]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
