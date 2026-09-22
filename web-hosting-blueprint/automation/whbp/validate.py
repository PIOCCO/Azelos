#!/usr/bin/env python3
"""Validate client configuration."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import yaml
from jsonschema import Draft7Validator

from automation.whbp.config_loader import load_yaml
from automation.whbp.paths import repo_root

DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$",
    re.IGNORECASE,
)

VALID_FRONTEND = {"static", "react", "vue", "nextjs", "none"}
VALID_BACKEND = {"node", "python", "go", "php", "none"}
VALID_ENV = {"development", "staging", "production"}
VALID_STRATEGY = {"rolling", "blue-green"}
VALID_PROFILE = {"small", "standard", "resilient"}


def validate_domain(name: str, value: str | None) -> list[str]:
    if not value:
        return [f"{name} domain is required when service is enabled"]
    if value.startswith("http"):
        return [f"{name} domain must be hostname only, not URL"]
    if not DOMAIN_RE.match(value):
        return [f"{name} domain invalid: {value}"]
    return []


def validate_resources(resources: dict) -> list[str]:
    errors = []
    for svc, limits in (resources or {}).items():
        if not isinstance(limits, dict):
            continue
        mem = str(limits.get("memory", ""))
        if mem and not re.match(r"^\d+[mMgG]$", mem):
            errors.append(f"resources.{svc}.memory invalid: {mem}")
    return errors


def validate_paths(cfg: dict, root: Path) -> list[str]:
    errors = []
    fe = cfg.get("frontend", {})
    be = cfg.get("backend", {})
    if fe.get("enabled"):
        ctx = fe.get("source", {}).get("build_context")
        if ctx and not (root / ctx).exists():
            errors.append(f"frontend build_context not found: {ctx}")
    if be.get("enabled"):
        ctx = be.get("source", {}).get("build_context")
        if ctx and not (root / ctx).exists():
            errors.append(f"backend build_context not found: {ctx}")
    return errors


def cross_environment_checks(cfg: dict, env_policy: dict) -> list[str]:
    errors = []
    env_type = cfg.get("environment", {}).get("type")
    policy = env_policy.get("environment", {})
    if env_type not in VALID_ENV:
        errors.append(f"invalid environment.type: {env_type}")
    if policy.get("forbid_production_domains") and env_type == "development":
        for key in ("frontend", "backend"):
            dom = cfg.get("domains", {}).get(key if key == "frontend" else "backend", "")
            if dom and not dom.endswith(".local") and "localhost" not in dom:
                errors.append(
                    f"development must not use production-like domain '{dom}' — use *.local or localhost"
                )
    if cfg.get("database", {}).get("enabled") and env_type == "development":
        # Prevent accidental prod DB host strings in client file
        db_host = cfg.get("database", {}).get("host")
        if db_host and db_host not in policy.get("allowed_database_hosts", ["postgres", "localhost"]):
            errors.append(f"development database host not allowed: {db_host}")
    return errors


def logical_checks(cfg: dict) -> list[str]:
    errors = []
    fe = cfg.get("frontend", {})
    be = cfg.get("backend", {})
    db = cfg.get("database", {})
    redis = cfg.get("redis", {})

    if fe.get("framework") not in VALID_FRONTEND:
        errors.append("invalid frontend.framework")
    if be.get("framework") not in VALID_BACKEND:
        errors.append("invalid backend.framework")
    if cfg.get("hosting", {}).get("profile") not in VALID_PROFILE:
        errors.append("invalid hosting.profile")
    if cfg.get("deployment", {}).get("strategy") not in VALID_STRATEGY:
        errors.append("invalid deployment.strategy")

    if not fe.get("enabled") and fe.get("framework") != "none":
        errors.append("frontend.framework must be 'none' when frontend.enabled is false")
    if not be.get("enabled") and be.get("framework") != "none":
        errors.append("backend.framework must be 'none' when backend.enabled is false")

    shared = cfg.get("hosting", {}).get("shared_proxy", False)
    if shared and fe.get("enabled") and not cfg.get("domains", {}).get("frontend"):
        errors.append("frontend domain is required when hosting.shared_proxy is true")

    if fe.get("enabled") and cfg.get("domains", {}).get("frontend"):
        errors.extend(validate_domain("frontend", cfg.get("domains", {}).get("frontend")))
    elif fe.get("enabled") and cfg.get("environment", {}).get("type") != "development":
        errors.extend(validate_domain("frontend", cfg.get("domains", {}).get("frontend")))
        port = fe.get("port") or fe.get("runtime_port")
        if port and not (1 <= int(port) <= 65535):
            errors.append("frontend port out of range")
    if be.get("enabled"):
        errors.extend(validate_domain("backend", cfg.get("domains", {}).get("backend")))
        if not be.get("health_endpoint"):
            errors.append("backend.health_endpoint required when backend enabled")

    if db.get("enabled"):
        if db.get("engine") != "postgresql":
            errors.append("only postgresql engine supported in this release")
        if not db.get("name") or not db.get("user"):
            errors.append("database.name and database.user required")
    else:
        if db.get("engine") not in (None, "none"):
            errors.append("database.engine must be 'none' when database.enabled is false")

    if db.get("enabled") and "password" in db:
        errors.append("do not put database passwords in client yaml — use secrets")

    errors.extend(validate_resources(cfg.get("resources", {})))
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--schema", default=str(repo_root() / "config/schemas/client.schema.json"))
    args = parser.parse_args()

    root = repo_root()
    cfg_path = Path(args.config)
    if not cfg_path.is_absolute():
        cfg_path = root / cfg_path
    cfg = load_yaml(cfg_path)

    schema = json.loads(Path(args.schema).read_text(encoding="utf-8"))
    validator = Draft7Validator(schema)
    errors = [f"schema: {e.message}" for e in validator.iter_errors(cfg)]

    env_type = cfg.get("environment", {}).get("type", "development")
    env_policy_path = root / "config/environments" / f"{env_type}.yaml"
    env_policy = load_yaml(env_policy_path) if env_policy_path.exists() else {}

    errors.extend(logical_checks(cfg))
    errors.extend(cross_environment_checks(cfg, env_policy))
    errors.extend(validate_paths(cfg, root))

    if errors:
        print("CONFIGURATION INVALID", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print("CONFIGURATION VALID")
    return 0


if __name__ == "__main__":
    sys.exit(main())
