"""Pure rule matching — no HTTP or session concerns."""

from typing import Any


def conditions_match(conditions: dict[str, Any], environment: dict[str, Any]) -> bool:
    for key, expected in conditions.items():
        if environment.get(key) != expected:
            return False
    return True


def merge_outcomes(
    outcomes: dict[str, Any],
    *,
    flags: dict[str, bool],
    module_keys: set[str],
) -> None:
    for key, val in outcomes.items():
        if key == "module_keys" and isinstance(val, list):
            module_keys.update(str(v) for v in val)
        elif isinstance(val, bool):
            flags[key] = val
        elif key != "module_keys":
            flags[key] = bool(val)
