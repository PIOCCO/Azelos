#!/usr/bin/env python3
"""
Authorized password baseline audit (offline only).

Builds candidate passwords from corporate baseline patterns + email list,
then checks candidates against password HASHES from an internal export.

Does NOT send login requests. Your security team should provide hashes from
the test tenant (AD export, app DB audit dump, etc.) under written scope.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import hmac
import sys
from pathlib import Path

from generate_passwords import apply_pattern, load_emails


def load_baseline(path: Path) -> tuple[list[str], list[str]]:
    patterns: list[str] = []
    literals: list[str] = []
    for ln in path.read_text(encoding="utf-8").splitlines():
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        if ln.startswith("literal:"):
            literals.append(ln.split(":", 1)[1].strip())
        else:
            patterns.append(ln)
    return patterns, literals


def load_hashes(path: Path) -> dict[str, tuple[str, str]]:
    """email -> (algorithm, hash_hex_or_bcrypt). algorithm: sha256|md5|plain"""
    out: dict[str, tuple[str, str]] = {}
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".csv":
        with path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fn = reader.fieldnames or []
            email_col = "email" if "email" in fn else fn[0]
            hash_col = "hash" if "hash" in fn else fn[1] if len(fn) > 1 else "hash"
            algo_col = "algorithm" if "algorithm" in fn else None
            for row in reader:
                email = row[email_col].strip().lower()
                h = row[hash_col].strip()
                algo = (row.get(algo_col) or "sha256").strip().lower() if algo_col else "sha256"
                out[email] = (algo, h)
        return out
    for ln in text.splitlines():
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        if "," in ln:
            email, h = [p.strip() for p in ln.split(",", 1)]
            out[email.lower()] = ("sha256", h)
        elif ":" in ln:
            email, h = [p.strip() for p in ln.split(":", 1)]
            out[email.lower()] = ("sha256", h)
    return out


def hash_password(password: str, algorithm: str) -> str:
    algo = algorithm.lower()
    data = password.encode("utf-8")
    if algo == "sha256":
        return hashlib.sha256(data).hexdigest()
    if algo == "md5":
        return hashlib.md5(data).hexdigest()
    if algo == "plain":
        return password
    raise ValueError(f"Unsupported algorithm: {algorithm}")


def verify(password: str, algo: str, expected: str) -> bool:
    if algo == "plain":
        return hmac.compare_digest(password, expected)
    got = hash_password(password, algo)
    return hmac.compare_digest(got.lower(), expected.lower())


def generate_candidates(
    emails: list[str],
    patterns: list[str],
    literals: list[str],
    start_index: int,
) -> list[tuple[str, str, str]]:
    """email, password, source (pattern or literal)"""
    rows: list[tuple[str, str, str]] = []
    for i, email in enumerate(emails, start=start_index):
        for pat in patterns:
            try:
                pwd = apply_pattern(pat, email, i)
            except ValueError:
                continue
            rows.append((email, pwd, f"pattern:{pat}"))
        for lit in literals:
            rows.append((email, lit, f"literal:{lit}"))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Offline baseline password audit (patterns + hash export)."
    )
    parser.add_argument("emails", type=Path, help="Email list (txt/csv)")
    parser.add_argument(
        "--baseline",
        type=Path,
        required=True,
        help="Baseline patterns (one per line); use literal:FixedPass for shared passwords",
    )
    parser.add_argument(
        "--hashes",
        type=Path,
        help="Internal hash export (csv: email,hash[,algorithm])",
    )
    parser.add_argument(
        "--candidates-out",
        type=Path,
        help="Write all generated candidates (email,password,source)",
    )
    parser.add_argument(
        "--matches-out",
        type=Path,
        help="Write weak matches (email,password,source)",
    )
    parser.add_argument("--start-index", type=int, default=1)
    args = parser.parse_args()

    emails = load_emails(args.emails)
    if not emails:
        print("No emails.", file=sys.stderr)
        return 1

    patterns, literals = load_baseline(args.baseline)
    if not patterns and not literals:
        print("Empty baseline file.", file=sys.stderr)
        return 1

    candidates = generate_candidates(emails, patterns, literals, args.start_index)
    print(
        f"Generated {len(candidates)} candidates for {len(emails)} accounts.",
        file=sys.stderr,
    )

    if args.candidates_out:
        with args.candidates_out.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["email", "password", "source"])
            w.writerows(candidates)
        print(f"Wrote {args.candidates_out}", file=sys.stderr)

    if args.hashes:
        hashes = load_hashes(args.hashes)
        matches = []
        for email, pwd, src in candidates:
            key = email.lower()
            if key not in hashes:
                continue
            algo, expected = hashes[key]
            if verify(pwd, algo, expected):
                matches.append((email, pwd, src))
        print(f"Baseline matches: {len(matches)} account(s).", file=sys.stderr)
        if args.matches_out:
            with args.matches_out.open("w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(["email", "password", "source"])
                w.writerows(matches)
            print(f"Wrote {args.matches_out}", file=sys.stderr)
        elif matches:
            w = csv.writer(sys.stdout)
            w.writerow(["email", "password", "source"])
            w.writerows(matches)
    elif not args.candidates_out:
        print("Provide --hashes and/or --candidates-out.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
