#!/usr/bin/env python3
"""
Convert email,password CSV (or pairs output) to Hydra -C format: login:password per line.

Does not run Hydra or send network traffic. Use only in scoped lab tests.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path


def load_pairs(path: Path) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    with path.open(newline="", encoding="utf-8") as f:
        sample = f.read(4096)
        f.seek(0)
        if "email" in sample.lower() and "password" in sample.lower():
            reader = csv.DictReader(f)
            for row in reader:
                e = (row.get("email") or "").strip()
                p = (row.get("password") or "").strip()
                if e and p:
                    rows.append((e, p))
            return rows
        for ln in path.read_text(encoding="utf-8").splitlines():
            ln = ln.strip()
            if not ln or ln.startswith("#"):
                continue
            if ": " in ln and "@" in ln.split(": ", 1)[0]:
                e, p = ln.split(": ", 1)
                rows.append((e.strip(), p.strip()))
            elif "," in ln:
                e, p = [x.strip() for x in ln.split(",", 1)]
                if e and p and e.lower() != "email":
                    rows.append((e, p))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="CSV → Hydra -C credential file")
    parser.add_argument("input", type=Path, help="email,password CSV or pairs file")
    parser.add_argument("-o", "--output", type=Path, required=True, help="Hydra -C file")
    args = parser.parse_args()

    pairs = load_pairs(args.input)
    if not pairs:
        print("No pairs found.", file=sys.stderr)
        return 1

    lines = [f"{e}:{p}" for e, p in pairs]
    args.output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(lines)} login:password lines to {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
