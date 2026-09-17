#!/usr/bin/env python3
"""Render docker-compose and nginx config from client.yaml."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import yaml

from automation.whbp.config_loader import load_yaml
from automation.whbp.paths import repo_root


def project_name(cfg: dict) -> str:
    return f"{cfg['client']['id']}-{cfg['environment']['type']}"


def generated_dir(cfg: dict) -> Path:
    root = repo_root()
    return root / ".generated" / project_name(cfg)


def render_compose(cfg: dict) -> dict:
    name = project_name(cfg)
    fe = cfg["frontend"]
    be = cfg["backend"]
    db = cfg["database"]
    redis = cfg["redis"]
    resources = cfg.get("resources", {})

    env_file = [".env.deploy"]

    services: dict = {
        "proxy": {
            "build": {"context": str(repo_root() / "proxy/nginx"), "dockerfile": "Dockerfile"},
            "ports": ["80:80", "443:443"],
            "depends_on": [],
            "env_file": env_file,
            "volumes": [
                "./nginx/conf.d:/etc/nginx/conf.d:ro",
                "./nginx/certs:/etc/nginx/certs:ro",
            ],
            "restart": "unless-stopped",
            "logging": _logging(cfg),
            "labels": _labels(cfg, "proxy"),
        }
    }

    if fe.get("enabled"):
        services["frontend"] = {
            "build": {
                "context": str(repo_root() / fe["source"]["build_context"]),
                "dockerfile": _frontend_dockerfile(fe["framework"]),
            },
            "expose": [str(fe.get("runtime_port") or fe.get("port") or 80)],
            "env_file": env_file,
            "restart": "unless-stopped",
            **_compose_limits(resources.get("frontend", {})),
            "logging": _logging(cfg),
            "labels": _labels(cfg, "frontend"),
        }
        services["proxy"]["depends_on"].append("frontend")

    if be.get("enabled"):
        services["backend"] = {
            "build": {
                "context": str(repo_root() / be["source"]["build_context"]),
                "dockerfile": "Dockerfile",
            },
            "expose": [str(be["port"])],
            "environment": [
                "WHBP_CLIENT_ID=${WHBP_CLIENT_ID}",
                "WHBP_ENV=${WHBP_ENV}",
            ],
            "env_file": env_file,
            "restart": "unless-stopped",
            **_compose_limits(resources.get("backend", {})),
            "logging": _logging(cfg),
            "labels": _labels(cfg, "backend"),
        }
        if db.get("enabled"):
            services["backend"]["environment"].append("DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}")
        if redis.get("enabled"):
            services["backend"]["environment"].append("REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0")
        services["proxy"]["depends_on"].append("backend")

    if db.get("enabled"):
        services["postgres"] = {
            "image": f"postgres:{db.get('version', '16')}-alpine",
            "environment": [
                "POSTGRES_DB=${POSTGRES_DB}",
                "POSTGRES_USER=${POSTGRES_USER}",
                "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}",
            ],
            "env_file": env_file,
            "volumes": ["postgres_data:/var/lib/postgresql/data"],
            "expose": ["5432"],
            "restart": "unless-stopped",
            "healthcheck": {
                "test": ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"],
                "interval": "10s",
                "timeout": "5s",
                "retries": 5,
            },
            **_compose_limits(resources.get("postgres", {})),
            "logging": _logging(cfg),
            "labels": _labels(cfg, "postgres"),
        }

    if redis.get("enabled"):
        services["redis"] = {
            "image": f"redis:{redis.get('version', '7')}-alpine",
            "command": ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--appendonly", "yes"],
            "env_file": env_file,
            "volumes": ["redis_data:/data"],
            "expose": ["6379"],
            "restart": "unless-stopped",
            "healthcheck": {
                "test": ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"],
                "interval": "10s",
                "timeout": "5s",
                "retries": 5,
            },
            **_compose_limits(resources.get("redis", {})),
            "logging": _logging(cfg),
            "labels": _labels(cfg, "redis"),
        }

    return {
        "name": name,
        "services": services,
        "volumes": {
            "postgres_data": {},
            "redis_data": {},
        },
        "networks": {"default": {"name": f"whbp_{name}"}},
    }


def _frontend_dockerfile(framework: str) -> str:
    if framework == "nextjs":
        return "Dockerfile.ssr"
    return "Dockerfile"


def _compose_limits(res: dict) -> dict:
    out: dict = {}
    if res.get("cpus"):
        out["cpus"] = float(res["cpus"])
    if res.get("memory"):
        out["mem_limit"] = str(res["memory"])
    return out


def _logging(cfg: dict) -> dict:
    lg = cfg.get("logging", {})
    return {
        "driver": lg.get("driver", "json-file"),
        "options": {
            "max-size": lg.get("max_size", "10m"),
            "max-file": lg.get("max_file", "3"),
            "labels": "client,application,environment,service",
        },
    }


def _labels(cfg: dict, service: str) -> dict:
    return {
        "client": cfg["client"]["id"],
        "application": cfg["application"]["slug"],
        "environment": cfg["environment"]["type"],
        "service": service,
    }


def render_nginx(cfg: dict) -> str:
    fe_dom = cfg.get("domains", {}).get("frontend", "_")
    be_dom = cfg.get("domains", {}).get("backend", "_")
    fe = cfg["frontend"]
    be = cfg["backend"]
    ssl = cfg.get("ssl", {}).get("enabled", False)

    lines = [
        "server {",
        "    listen 80;",
        f"    server_name {fe_dom};",
        "    location / {",
    ]
    if ssl:
        lines.append("        return 301 https://$host$request_uri;")
        lines.append("    }")
        lines.append("}")
        lines.append("server {")
        lines.append("    listen 443 ssl http2;")
        lines.append(f"    server_name {fe_dom};")
        lines.append("    ssl_certificate     /etc/nginx/certs/fullchain.pem;")
        lines.append("    ssl_certificate_key /etc/nginx/certs/privkey.pem;")
        lines.append("    include /etc/nginx/conf.d/snippets/security-headers.conf;")
        lines.append("    client_max_body_size 25m;")
        lines.append("    location / {")
    else:
        lines.append("        include /etc/nginx/conf.d/snippets/security-headers.conf;")

    if fe.get("enabled"):
        upstream_port = fe.get("runtime_port") or fe.get("port") or 80
        lines.append(f"        proxy_pass http://frontend:{upstream_port};")
        lines.append("        proxy_set_header Host $host;")
        lines.append("        proxy_set_header X-Real-IP $remote_addr;")
        lines.append("        proxy_http_version 1.1;")
        lines.append('        proxy_set_header Upgrade $http_upgrade;')
        lines.append('        proxy_set_header Connection "upgrade";')
    else:
        lines.append("        return 404;")

    lines.extend(["    }", "}"])

    if be.get("enabled"):
        lines.extend(
            [
                "server {",
                "    listen 80;",
                f"    server_name {be_dom};",
            ]
        )
        if ssl:
            lines.append("    return 301 https://$host$request_uri;")
            lines.append("}")
            lines.extend(
                [
                    "server {",
                    "    listen 443 ssl http2;",
                    f"    server_name {be_dom};",
                    "    ssl_certificate     /etc/nginx/certs/fullchain.pem;",
                    "    ssl_certificate_key /etc/nginx/certs/privkey.pem;",
                    "    include /etc/nginx/conf.d/snippets/security-headers.conf;",
                    "    client_max_body_size 25m;",
                    "    location / {",
                ]
            )
        else:
            lines.append("    include /etc/nginx/conf.d/snippets/security-headers.conf;")
            lines.append("    location / {")
        lines.extend(
            [
                f"        proxy_pass http://backend:{be['port']};",
                "        proxy_set_header Host $host;",
                "        proxy_set_header X-Real-IP $remote_addr;",
                "        proxy_read_timeout 120s;",
                "    }",
                "}",
            ]
        )

    return "\n".join(lines) + "\n"


def render_env(cfg: dict) -> str:
    db = cfg.get("database", {})
    secrets = cfg.get("secrets", {})
    lines = [
        f"WHBP_CLIENT_ID={cfg['client']['id']}",
        f"WHBP_ENV={cfg['environment']['type']}",
        f"POSTGRES_DB={db.get('name', 'appdb')}",
        f"POSTGRES_USER={db.get('user', 'appuser')}",
        f"POSTGRES_PASSWORD=${{{secrets.get('postgres_password', 'WHBP_POSTGRES_PASSWORD')}}}",
    ]
    if cfg.get("redis", {}).get("enabled"):
        lines.append(f"REDIS_PASSWORD=${{{secrets.get('redis_password', 'WHBP_REDIS_PASSWORD')}}}")
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    root = repo_root()
    cfg_path = Path(args.config)
    if not cfg_path.is_absolute():
        cfg_path = root / cfg_path
    cfg = load_yaml(cfg_path)

    out = generated_dir(cfg)
    nginx_dir = out / "nginx/conf.d"
    nginx_dir.mkdir(parents=True, exist_ok=True)
    (nginx_dir / "default.conf").write_text(render_nginx(cfg), encoding="utf-8")
    (out / "docker-compose.yml").write_text(yaml.safe_dump(render_compose(cfg), sort_keys=False), encoding="utf-8")
    (out / ".env.compose").write_text(render_env(cfg), encoding="utf-8")
    (out / "metadata.json").write_text(json.dumps({"project": project_name(cfg), "client": cfg["client"]["id"]}, indent=2), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
