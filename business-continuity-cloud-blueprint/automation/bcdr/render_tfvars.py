#!/usr/bin/env python3
"""Render terraform.tfvars from client.yaml."""

from __future__ import annotations

import argparse
from pathlib import Path

from automation.bcdr.config import load_yaml


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--client", required=True)
    parser.add_argument("--environment", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    cfg = load_yaml(Path(args.client))
    client = cfg.get("client", {})
    cloud = cfg.get("cloud", {})
    monitoring = cfg.get("monitoring", {})
    recovery = cfg.get("recovery", {})
    tags = cfg.get("tags", {})
    backup = cfg.get("backup", {})

    name = client.get("name", "client")
    env = args.environment
    name_prefix = f"bcbp-{env}" if env != "production" else f"bcbp-prod"

    lines = [
        f'name_prefix = "{name_prefix}"',
        f'primary_region = "{cloud.get("primary_region", "eastus")}"',
        f'secondary_region = "{cloud.get("secondary_region", "westus2")}"',
        f'profile = "{cloud.get("profile", "standard")}"',
        f'alert_email = "{monitoring.get("alert_email", "ops@example.com")}"',
        f'backup_retention_days = {int(backup.get("retention_days", 30))}',
        f'standby_compute = {"true" if recovery.get("standby_compute") else "false"}',
        f'enable_immutability = {"true" if backup.get("immutability_enabled", True) else "false"}',
        "tags = {",
    ]
    merged_tags = {**tags, "client": name, "env": env}
    for k, v in merged_tags.items():
        lines.append(f'  {k} = "{v}"')
    lines.append("}")

    Path(args.output).write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
