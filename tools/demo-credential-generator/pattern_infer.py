"""Infer password pattern from known (email, password) pairs."""

from __future__ import annotations

import re
from collections import Counter

from generate_passwords import apply_pattern, parse_local

# Longest values first so "hr.user" matches before "hr"
_PLACEHOLDER_KEYS = (
    "local_nodot",
    "local",
    "First",
    "Last",
    "LOCAL",
    "first",
    "last",
    "domain",
    "domain_base",
)


def _values_for_email(email: str, index: int = 1) -> dict[str, str]:
    ctx = parse_local(email)
    return {
        "local": ctx["local"],
        "local_nodot": ctx["local_nodot"],
        "first": ctx["first"],
        "last": ctx["last"],
        "domain": ctx["domain"],
        "domain_base": ctx["domain_base"],
        "index": str(index),
        "First": ctx["first"].capitalize(),
        "Last": ctx["last"].capitalize() if ctx["last"] else ctx["first"].capitalize(),
        "LOCAL": ctx["local"].upper(),
    }


def infer_pattern_from_pair(email: str, password: str, index: int = 1) -> str:
    """Replace email-derived substrings in password with {placeholders}."""
    vals = _values_for_email(email, index)
    pattern = password
    items = [(k, vals[k]) for k in _PLACEHOLDER_KEYS if vals.get(k)]
    items.sort(key=lambda x: len(x[1]), reverse=True)
    for key, val in items:
        if val in pattern:
            pattern = pattern.replace(val, "{" + key + "}")
    return pattern


def verify_pattern(pattern: str, email: str, expected: str, index: int = 1) -> bool:
    try:
        return apply_pattern(pattern, email, index) == expected
    except ValueError:
        return False


def infer_pattern_from_samples(samples: list[tuple[str, str]]) -> str:
    """
    Infer one pattern from several known pairs. Raises ValueError if inconsistent.
    """
    if not samples:
        raise ValueError("Need at least one (email, password) sample")

    patterns = []
    for i, (email, pwd) in enumerate(samples, start=1):
        patterns.append(infer_pattern_from_pair(email, pwd, index=i))

    counts = Counter(patterns)
    best, n = counts.most_common(1)[0]
    if len(counts) > 1 and n < len(samples):
        raise ValueError(
            "Samples suggest multiple patterns: "
            + ", ".join(f"{p!r} ({c}x)" for p, c in counts.most_common())
        )

    pattern = best
    for i, (email, pwd) in enumerate(samples, start=1):
        if not verify_pattern(pattern, email, pwd, index=i):
            # Retry with index=1 for all (pattern may not use {index})
            if not verify_pattern(pattern, email, pwd, index=1):
                raise ValueError(
                    f"Pattern {pattern!r} does not reproduce password for {email!r}"
                )
    return pattern


def pattern_uses_index(pattern: str) -> bool:
    return "{index}" in pattern
