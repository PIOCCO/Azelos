#!/usr/bin/env python3
"""Validate client SOC 2 configuration."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from automation.soc2.config import load_yaml
from automation.soc2.paths import repo_root

VALID_ENV = {"development", "staging", "production"}
VALID_CLOUD = {"azure", "aws", "gcp"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    root = repo_root()
    path = Path(args.config)
    if not path.is_absolute():
        path = root / path
    cfg = load_yaml(path)
    errors = []

    if not cfg.get("client", {}).get("id"):
        errors.append("client.id required")
    env_type = cfg.get("environment", {}).get("type")
    if env_type not in VALID_ENV:
        errors.append(f"invalid environment.type: {env_type}")
    provider = cfg.get("cloud", {}).get("primary_provider")
    if provider not in VALID_CLOUD:
        errors.append(f"invalid cloud.primary_provider: {provider}")

    crit = cfg.get("soc2", {}).get("criteria", {})
    if not crit.get("security", True):
        errors.append("security criteria must remain enabled for SOC 2 scope")

    if errors:
        print("CONFIGURATION INVALID", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print("CONFIGURATION VALID")
    return 0


if __name__ == "__main__":
    sys.exit(main())
