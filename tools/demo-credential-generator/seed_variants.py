#!/usr/bin/env python3
"""Build Hydra -C lines: random-ish password variants from one seed password."""

from __future__ import annotations

import argparse
import hashlib
import random
import sys
from pathlib import Path

from generate_passwords import load_emails


def _mutations(seed: str, rng: random.Random) -> list[str]:
    """Several variants; caller picks one or many."""
    out = [seed]
    if seed:
        out.append(seed + str(rng.randint(0, 9999)))
        out.append(seed + "!")
        out.append(seed + str(rng.randint(2020, 2026)))
        out.append(seed.capitalize())
        out.append(seed.lower())
        out.append(seed.upper())
        leet = seed.replace("a", "@").replace("A", "@").replace("e", "3").replace("E", "3")
        if leet != seed:
            out.append(leet)
        if len(seed) > 1:
            out.append(seed[0].upper() + seed[1:])
            out.append(seed[::-1])
    # dedupe keep order
    seen: set[str] = set()
    uniq: list[str] = []
    for p in out:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return uniq


def one_variant_per_email(seed: str, email: str) -> str:
    """Deterministic variant per email (same seed+email → same password every run)."""
    digest = hashlib.sha256(f"{seed}\0{email}".encode()).hexdigest()
    rng = random.Random(digest)
    choices = _mutations(seed, rng)
    return rng.choice(choices)


def variants_for_email(seed: str, email: str, count: int) -> list[str]:
    digest = hashlib.sha256(f"{seed}\0{email}\0variants".encode()).hexdigest()
    rng = random.Random(digest)
    pool = _mutations(seed, rng)
    while len(pool) < count:
        pool.append(seed + str(rng.randint(10000, 999999)))
    rng.shuffle(pool)
    return pool[:count]


def global_variants(seed: str, count: int, master: str | None) -> list[str]:
    rng = random.Random(master or seed)
    pool = _mutations(seed, rng)
    while len(pool) < count:
        pool.append(seed + str(rng.randint(10000, 999999)))
    rng.shuffle(pool)
    return pool[:count]


def write_hydra_c(path: Path, pairs: list[tuple[str, str]]) -> None:
    path.write_text("\n".join(f"{e}:{p}" for e, p in pairs) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate hydra -C file: seed password → variants × demo emails."
    )
    parser.add_argument("emails", type=Path, help="Email list (csv/txt)")
    parser.add_argument("--seed-password", required=True, help="Base password to mutate")
    parser.add_argument(
        "--mode",
        choices=("per-email", "one-for-all", "spray"),
        default="per-email",
        help="per-email: one variant each account; one-for-all: same variant on all; spray: many variants × all emails",
    )
    parser.add_argument(
        "--variant-count",
        type=int,
        default=8,
        help="For spray mode: variants from seed; for per-email with --tries-per-email",
    )
    parser.add_argument(
        "--tries-per-email",
        type=int,
        default=1,
        help="Per-email mode: how many different variants to try per address",
    )
    parser.add_argument("-o", "--output", type=Path, default=Path("hydra-C.txt"))
    args = parser.parse_args()

    if not args.emails.is_file():
        print(f"Not found: {args.emails}", file=sys.stderr)
        return 1

    emails = load_emails(args.emails)
    if not emails:
        print("No emails.", file=sys.stderr)
        return 1

    pairs: list[tuple[str, str]] = []
    seed = args.seed_password

    if args.mode == "one-for-all":
        digest = hashlib.sha256(f"{seed}\0one".encode()).hexdigest()
        rng = random.Random(digest)
        pwd = rng.choice(_mutations(seed, rng))
        pairs = [(e, pwd) for e in emails]
        print(f"One variant for all {len(emails)} emails: {pwd!r}", file=sys.stderr)

    elif args.mode == "per-email":
        for email in emails:
            if args.tries_per_email <= 1:
                pairs.append((email, one_variant_per_email(seed, email)))
            else:
                for pwd in variants_for_email(seed, email, args.tries_per_email):
                    pairs.append((email, pwd))

    else:  # spray
        vars_ = global_variants(seed, args.variant_count, None)
        for email in emails:
            for pwd in vars_:
                pairs.append((email, pwd))
        print(f"Spray: {len(vars_)} variants × {len(emails)} emails = {len(pairs)} tries", file=sys.stderr)

    write_hydra_c(args.output, pairs)
    print(f"Wrote {len(pairs)} lines to {args.output.resolve()}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
