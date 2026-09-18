from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def load_client(path: Path) -> dict[str, Any]:
    return load_yaml(path)


def enabled_criteria(client: dict[str, Any]) -> list[str]:
    crit = client.get("soc2", {}).get("criteria", {})
    enabled = ["security"]  # baseline
    for key in ("availability", "processing_integrity", "confidentiality", "privacy"):
        if crit.get(key):
            enabled.append(key)
    return enabled


def controls_in_scope(client: dict[str, Any], catalog: dict[str, Any]) -> dict[str, Any]:
    criteria = set(enabled_criteria(client))
    scoped = {}
    for cid, ctrl in catalog.get("controls", {}).items():
        tsc = set(ctrl.get("tsc", []))
        if tsc & criteria:
            scoped[cid] = ctrl
    return scoped
