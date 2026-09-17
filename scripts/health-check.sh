#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

load_env
require_cmd python3
require_cmd curl

PHASE="standard"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --phase) PHASE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

APP_URL="$(yaml_get services.application_url)"
API_URL="$(yaml_get services.api_url)"
HEALTH_PATH="$(yaml_get services.health_path)"

RESULTS="${BCBP_ROOT}/reports/health/health-$(date -u +%Y%m%dT%H%M%SZ).json"
mkdir -p "$(dirname "${RESULTS}")"

python3 - "${APP_URL}" "${API_URL}" "${HEALTH_PATH}" "${PHASE}" "${BCBP_MOCK_MODE}" "${RESULTS}" <<'PY'
import json, sys, subprocess, socket, ssl
from urllib.parse import urlparse

app_url, api_url, health_path, phase, mock, out = sys.argv[1:7]
checks = []

def add(name, status, detail):
    checks.append({"check": name, "status": status, "detail": detail})

if mock == "true":
    add("dns", "PASS", "mock mode")
    add("https", "PASS", "mock mode")
    add("application_endpoint", "PASS", "mock mode")
    add("api_endpoint", "PASS", "mock mode")
    add("database_connectivity", "WARNING", "not tested in mock mode")
    add("storage", "WARNING", "not tested in mock mode")
else:
    for label, url in [("application_endpoint", app_url), ("api_endpoint", api_url)]:
        if not url:
            add(label, "WARNING", "URL not configured in client.yaml")
            continue
        parsed = urlparse(url)
        host = parsed.hostname or ""
        try:
            socket.getaddrinfo(host, 443)
            add("dns", "PASS", f"resolved {host}")
        except socket.gaierror as exc:
            add("dns", "FAIL", str(exc))
        try:
            ctx = ssl.create_default_context()
            with socket.create_connection((host, 443), timeout=10) as sock:
                with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                    add("https", "PASS", f"TLS {ssock.version()}")
        except OSError as exc:
            add("https", "FAIL", str(exc))
        try:
            proc = subprocess.run(["curl", "-fsS", "-m", "15", "-o", "/dev/null", "-w", "%{http_code}", url], capture_output=True, text=True)
            code = proc.stdout.strip()
            if proc.returncode != 0:
                add(label, "FAIL", proc.stderr.strip() or "curl failed")
            elif code.startswith("2"):
                add(label, "WARNING", f"HTTP {code} — liveness only; verify business logic separately")
            else:
                add(label, "FAIL", f"HTTP {code}")
        except OSError as exc:
            add(label, "FAIL", str(exc))

    add("database_connectivity", "WARNING", "Configure DB probe via private endpoint in production")
    add("storage", "WARNING", "Configure storage probe with managed identity")

worst = 0
for c in checks:
    if c["status"] == "FAIL":
        worst = 2
    elif c["status"] == "WARNING" and worst == 0:
        worst = 1

summary = "PASS" if worst == 0 else ("WARNING" if worst == 1 else "FAIL")
doc = {"phase": phase, "summary": summary, "checks": checks}
json.dump(doc, open(out, "w"), indent=2)
print(summary)
for c in checks:
    print(f"{c['check']}: {c['status']} — {c['detail']}")
sys.exit(0 if summary != "FAIL" else 1)
PY

exit $?
