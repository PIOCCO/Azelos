#!/usr/bin/env python3
"""
Demo password bot: learn a pattern from known accounts, then fill passwords for an email list.

Use only for accounts you provision (dev/demo/staging).
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

from generate_passwords import apply_pattern, load_emails
from pattern_infer import infer_pattern_from_samples, pattern_uses_index


def load_samples(path: Path) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames and "email" in reader.fieldnames and "password" in reader.fieldnames:
            for row in reader:
                e, p = row["email"].strip(), row["password"].strip()
                if e and p:
                    rows.append((e, p))
            return rows
    # Fallback: two columns without header
    with path.open(encoding="utf-8") as f:
        for ln in f:
            ln = ln.strip()
            if not ln or ln.startswith("#"):
                continue
            parts = [p.strip() for p in ln.split(",")]
            if len(parts) >= 2:
                rows.append((parts[0], parts[1]))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Learn password pattern from samples, generate for email list."
    )
    parser.add_argument(
        "emails",
        type=Path,
        nargs="?",
        help="Emails to generate (one per line). Omit if only verifying samples.",
    )
    parser.add_argument(
        "--samples",
        type=Path,
        help="CSV or 'email,password' lines — used to infer pattern",
    )
    parser.add_argument(
        "--pattern",
        help="Skip inference; use this pattern directly",
    )
    parser.add_argument("--output", type=Path, help="Write CSV (email,password)")
    parser.add_argument("--start-index", type=int, default=1)
    parser.add_argument(
        "--print-pattern",
        action="store_true",
        help="Print inferred pattern to stderr and exit (no generation)",
    )
    args = parser.parse_args()

    pattern = args.pattern
    if not pattern:
        if not args.samples:
            print("Provide --pattern or --samples to infer one.", file=sys.stderr)
            return 1
        samples = load_samples(args.samples)
        if not samples:
            print("No samples in file.", file=sys.stderr)
            return 1
        try:
            pattern = infer_pattern_from_samples(samples)
        except ValueError as exc:
            print(f"Inference failed: {exc}", file=sys.stderr)
            return 1
        print(f"Inferred pattern: {pattern}", file=sys.stderr)

    if args.print_pattern:
        print(pattern)
        return 0

    if not args.emails:
        print("Provide an emails file to generate credentials.", file=sys.stderr)
        return 1

    emails = load_emails(args.emails)
    if not emails:
        print("No emails found.", file=sys.stderr)
        return 1

    use_index = pattern_uses_index(pattern)
    rows = []
    for i, email in enumerate(emails, start=args.start_index):
        idx = i if use_index else 1
        try:
            pwd = apply_pattern(pattern, email, idx)
        except ValueError as exc:
            print(f"Skip {email}: {exc}", file=sys.stderr)
            continue
        rows.append((email, pwd))

    if args.output:
        with args.output.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["email", "password"])
            w.writerows(rows)
        print(f"Wrote {len(rows)} rows to {args.output}", file=sys.stderr)
    else:
        w = csv.writer(sys.stdout)
        w.writerow(["email", "password"])
        w.writerows(rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
