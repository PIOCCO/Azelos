#!/usr/bin/env python3
"""
Generate demo/test passwords from a pattern + email list.

FOR ACCOUNTS YOU OWN OR PROVISION ONLY (dev, staging, demos).
Do not use on third-party or production user accounts without authorization.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path


def parse_local(email: str) -> dict[str, str]:
    local, _, domain = email.strip().lower().partition("@")
    if not domain:
        raise ValueError(f"Invalid email: {email!r}")
    parts = local.split(".")
    first = parts[0] if parts else local
    last = parts[-1] if len(parts) > 1 else ""
    return {
        "local": local,
        "local_nodot": local.replace(".", ""),
        "first": first,
        "last": last,
        "domain": domain,
        "domain_base": domain.split(".")[0],
    }


def apply_pattern(pattern: str, email: str, index: int) -> str:
    """
    Placeholders (case-sensitive in braces):
      {local} {local_nodot} {first} {last} {domain} {domain_base} {index}
      {First} {Last} — capitalized first/last
      {LOCAL} — local part uppercased
    Literal text outside braces is kept as-is.
    """
    ctx = parse_local(email)
    repl = {
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

    def sub(m: re.Match) -> str:
        key = m.group(1)
        if key not in repl:
            raise ValueError(f"Unknown placeholder {{{key}}} in pattern")
        return repl[key]

    return re.sub(r"\{(\w+)\}", sub, pattern)


def load_emails(path: Path) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    out = []
    for ln in lines:
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        out.append(ln.split(",")[0].strip())
    return out


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate passwords for demo emails using a pattern (accounts you administer only)."
    )
    parser.add_argument("emails", type=Path, help="Text file: one email per line")
    parser.add_argument(
        "--pattern",
        required=True,
        help='e.g. "{First}123!" or "Demo-{index}-{local_nodot}"',
    )
    parser.add_argument("--output", type=Path, help="Write CSV (email,password). Default: stdout")
    parser.add_argument("--start-index", type=int, default=1, help="First {index} value (default 1)")
    args = parser.parse_args()

    emails = load_emails(args.emails)
    if not emails:
        print("No emails found.", file=sys.stderr)
        return 1

    rows = []
    for i, email in enumerate(emails, start=args.start_index):
        try:
            pwd = apply_pattern(args.pattern, email, i)
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
