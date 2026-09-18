from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def merge_env_policy(client: dict[str, Any], env_policy: dict[str, Any]) -> dict[str, Any]:
    """Overlay environment guardrails (does not mutate secrets)."""
    merged = dict(client)
    policy = env_policy.get("environment", {})
    if policy.get("ssl", {}).get("enabled") is False:
        merged.setdefault("ssl", {})["enabled"] = False
    return merged
