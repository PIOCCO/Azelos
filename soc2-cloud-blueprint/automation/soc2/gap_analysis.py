#!/usr/bin/env python3
"""Generate gap analysis — does NOT claim SOC 2 compliance."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from automation.soc2.checks import run_all
from automation.soc2.config import enabled_criteria, load_yaml
from automation.soc2.paths import repo_root


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config/clients/example.yaml")
    parser.add_argument("--output", default="gap-analysis.json")
    parser.add_argument("--mock", action="store_true")
    args = parser.parse_args()

    root = repo_root()
    cfg_path = Path(args.config)
    if not cfg_path.is_absolute():
        cfg_path = root / cfg_path
    client = load_yaml(cfg_path)
    catalog = load_yaml(root / "config/controls.yaml")

    results = run_all(client, catalog, mock=args.mock or __import__("os").environ.get("SOC2BP_MOCK_MODE") == "true")
    gaps = [r for r in results if r.get("status") in {"GAP", "WARNING", "MANUAL"}]

    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "client_id": client.get("client", {}).get("id"),
        "criteria_in_scope": enabled_criteria(client),
        "disclaimer": "Readiness assessment only — not a SOC 2 opinion or audit report.",
        "summary": {
            "controls_evaluated": len(results),
            "gaps_and_warnings": len(gaps),
        },
        "results": results,
    }

    out = Path(args.output)
    if not out.is_absolute():
        out = root / out
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))
    return 1 if any(r.get("status") == "GAP" for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
