#!/usr/bin/env python3
"""Collect evidence artifacts into manifest (UTC timestamps, client isolation)."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from automation.soc2.config import controls_in_scope, load_yaml
from automation.soc2.paths import repo_root


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def collect_policies(manifest_dir: Path) -> list[dict]:
    root = repo_root()
    items = []
    for policy in root.glob("policies/**/policy.md"):
        dest = manifest_dir / "policies" / policy.relative_to(root / "policies")
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(policy, dest)
        items.append(
            {
                "type": "policy",
                "source": str(policy.relative_to(root)),
                "sha256": sha256_file(dest),
                "collected_at_utc": datetime.now(timezone.utc).isoformat(),
            }
        )
    return items


def collect_azure_policy_export(manifest_dir: Path, mock: bool) -> list[dict]:
    if mock or not shutil.which("az"):
        placeholder = manifest_dir / "cloud/azure/policy-state-mock.json"
        placeholder.parent.mkdir(parents=True, exist_ok=True)
        placeholder.write_text(json.dumps({"mode": "mock", "note": "Replace with az policy state export"}) + "\n")
        return [{"type": "azure_policy", "path": str(placeholder.name), "mock": True}]
    proc = subprocess.run(["az", "account", "show"], capture_output=True)
    if proc.returncode != 0:
        return []
    out = manifest_dir / "cloud/azure/account-show.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["az", "account", "show"], stdout=out.open("w"), check=False)
    return [{"type": "azure_account", "path": str(out.relative_to(manifest_dir)), "sha256": sha256_file(out)}]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    root = repo_root()
    cfg_path = Path(args.config)
    if not cfg_path.is_absolute():
        cfg_path = root / cfg_path
    client = load_yaml(cfg_path)
    client_id = client["client"]["id"]
    mock = __import__("os").environ.get("SOC2BP_MOCK_MODE", "false").lower() == "true"

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    manifest_dir = root / "evidence/manifests" / f"{client_id}-{stamp}"
    manifest_dir.mkdir(parents=True, exist_ok=True)

    artifacts = []
    artifacts.extend(collect_policies(manifest_dir))
    if client.get("cloud", {}).get("primary_provider") == "azure":
        artifacts.extend(collect_azure_policy_export(manifest_dir, mock))

    inv = client.get("integrations", {}).get("web_hosting", {})
    if inv.get("enabled") and inv.get("inventory_path"):
        p = Path(inv["inventory_path"])
        if p.exists():
            dest = manifest_dir / "integrations/web-hosting-inventory.json"
            shutil.copy2(p, dest)
            artifacts.append({"type": "integration", "source": "web_hosting_inventory", "sha256": sha256_file(dest)})

    manifest = {
        "client_id": client_id,
        "collected_at_utc": datetime.now(timezone.utc).isoformat(),
        "criteria": client.get("soc2", {}).get("criteria"),
        "artifacts": artifacts,
        "disclaimer": "Evidence pack for auditor review — sufficiency determined by independent auditor.",
    }
    manifest_path = manifest_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(manifest_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
