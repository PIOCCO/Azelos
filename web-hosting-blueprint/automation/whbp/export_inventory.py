#!/usr/bin/env python3
"""Export inventory for future Business Continuity integration."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from automation.whbp.config_loader import load_yaml
from automation.whbp.paths import repo_root


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    root = repo_root()
    cfg_path = Path(args.config)
    if not cfg_path.is_absolute():
        cfg_path = root / cfg_path
    cfg = load_yaml(cfg_path)

    out_path = root / cfg.get("integration", {}).get("business_continuity", {}).get("export_path", "exports/inventory.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    doc = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "client_id": cfg["client"]["id"],
        "application": cfg["application"]["slug"],
        "environment": cfg["environment"]["type"],
        "services": [],
        "dependencies": [],
        "health_endpoint": cfg.get("backend", {}).get("health_endpoint", "/health"),
        "deployment_strategy": cfg.get("deployment", {}).get("strategy"),
    }
    if cfg.get("frontend", {}).get("enabled"):
        doc["services"].append({"name": "frontend", "framework": cfg["frontend"]["framework"]})
    if cfg.get("backend", {}).get("enabled"):
        doc["services"].append({"name": "backend", "framework": cfg["backend"]["framework"]})
    if cfg.get("database", {}).get("enabled"):
        doc["services"].append({"name": "postgres", "engine": "postgresql"})
        doc["dependencies"].append("postgres")
    if cfg.get("redis", {}).get("enabled"):
        doc["services"].append({"name": "redis", "engine": "redis"})
        doc["dependencies"].append("redis")

    out_path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
