"""Helpers for relationship map layout stored in organization_settings."""

from __future__ import annotations

from typing import Any

from app.schemas.relationship_map_layout import NodePosition

RELATIONSHIP_MAP_LAYOUT_KEY = "relationship_map_layout_v1"
_LAYOUT_VERSION = 1


def layout_from_setting_value(raw: dict[str, Any] | None) -> dict[str, NodePosition]:
    if not raw or not isinstance(raw, dict):
        return {}
    positions_raw = raw.get("positions")
    if not isinstance(positions_raw, dict):
        return {}
    out: dict[str, NodePosition] = {}
    for node_id, pos in positions_raw.items():
        if not isinstance(node_id, str) or not isinstance(pos, dict):
            continue
        try:
            out[node_id] = NodePosition(x=float(pos["x"]), y=float(pos["y"]))
        except (KeyError, TypeError, ValueError):
            continue
    return out


def layout_to_setting_value(positions: dict[str, NodePosition]) -> dict[str, Any]:
    return {
        "version": _LAYOUT_VERSION,
        "positions": {k: {"x": v.x, "y": v.y} for k, v in positions.items()},
    }
