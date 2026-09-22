#!/usr/bin/env python3
"""Render the shared Traefik edge proxy docker-compose stack.

A single Traefik instance per host owns :80/:443 and routes to every client
stack by Host header, so multiple clients share one VM without port conflicts.
Client stacks attach to the external ``whbp_edge`` network (see render.py).
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import yaml

from automation.whbp.paths import repo_root
from automation.whbp.render import EDGE_NETWORK

TRAEFIK_IMAGE = "traefik:v3.1"
LETSENCRYPT_STAGING = "https://acme-staging-v02.api.letsencrypt.org/directory"


def _as_bool(value: str | bool | None) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def render_edge(
    *,
    acme: bool = False,
    acme_email: str = "",
    acme_staging: bool = False,
    dashboard: bool = False,
) -> dict:
    """Build the Traefik edge compose document.

    Traefik is configured entirely via CLI flags so the stack is self-contained
    (no mounted static config file). ACME/Let's Encrypt and the insecure
    dashboard are opt-in.
    """
    command = [
        "--providers.docker=true",
        "--providers.docker.exposedbydefault=false",
        f"--providers.docker.network={EDGE_NETWORK}",
        "--entrypoints.web.address=:80",
        "--entrypoints.websecure.address=:443",
        "--ping=true",
    ]

    if dashboard:
        command += ["--api.dashboard=true", "--api.insecure=true"]

    if acme:
        if not acme_email:
            raise ValueError("acme_email is required when acme is enabled")
        command += [
            f"--certificatesresolvers.letsencrypt.acme.email={acme_email}",
            "--certificatesresolvers.letsencrypt.acme.storage=/acme/acme.json",
            "--certificatesresolvers.letsencrypt.acme.httpchallenge=true",
            "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web",
            # Redirect all plain HTTP to HTTPS once we can issue certificates.
            "--entrypoints.web.http.redirections.entrypoint.to=websecure",
            "--entrypoints.web.http.redirections.entrypoint.scheme=https",
        ]
        if acme_staging:
            command.append(
                f"--certificatesresolvers.letsencrypt.acme.caserver={LETSENCRYPT_STAGING}"
            )

    ports = ["80:80", "443:443"]
    if dashboard:
        # Bind the dashboard to loopback only — never expose it publicly.
        ports.append("127.0.0.1:8080:8080")

    traefik: dict = {
        "image": TRAEFIK_IMAGE,
        "restart": "unless-stopped",
        "command": command,
        "ports": ports,
        "volumes": [
            "/var/run/docker.sock:/var/run/docker.sock:ro",
            "./acme:/acme",
        ],
        "networks": ["edge"],
        "healthcheck": {
            "test": ["CMD", "traefik", "healthcheck", "--ping"],
            "interval": "10s",
            "timeout": "5s",
            "retries": 5,
        },
        "labels": {"whbp.role": "edge-proxy"},
    }

    return {
        "name": "whbp-edge",
        "services": {"traefik": traefik},
        "networks": {"edge": {"name": EDGE_NETWORK, "external": True}},
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        default=str(repo_root() / ".generated/edge/docker-compose.yml"),
    )
    args = parser.parse_args()

    doc = render_edge(
        acme=_as_bool(os.environ.get("WHBP_TRAEFIK_ACME")),
        acme_email=os.environ.get("WHBP_ACME_EMAIL", ""),
        acme_staging=_as_bool(os.environ.get("WHBP_ACME_STAGING")),
        dashboard=_as_bool(os.environ.get("WHBP_TRAEFIK_DASHBOARD")),
    )

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    (out.parent / "acme").mkdir(parents=True, exist_ok=True)
    out.write_text(yaml.safe_dump(doc, sort_keys=False), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
