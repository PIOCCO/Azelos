#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
load_env

GEN="$(render_stack)"
COMPOSE_FILE="${GEN}/docker-compose.yml"
ENV_FILE="${WHBP_ROOT}/.env"
COMPOSE_ENV="${GEN}/.env.compose"

[[ -f "${COMPOSE_FILE}" ]] || die "Compose file missing — run deploy first"

set -a
[[ -f "${ENV_FILE}" ]] && source "${ENV_FILE}"
[[ -f "${COMPOSE_ENV}" ]] && source "${COMPOSE_ENV}"
set +a

export WHBP_POSTGRES_PASSWORD="${WHBP_POSTGRES_PASSWORD:-devpass}"
export WHBP_REDIS_PASSWORD="${WHBP_REDIS_PASSWORD:-devredis}"

COMPOSE_DIR="$(dirname "${COMPOSE_FILE}")"
DEPLOY_ENV="${GEN}/.env.deploy"
export COMPOSE_FILE

python3 - "${WHBP_CLIENT_CONFIG}" "${COMPOSE_FILE}" "${COMPOSE_DIR}" "${DEPLOY_ENV}" <<'PY'
import subprocess, sys
from pathlib import Path
from automation.whbp.config_loader import load_yaml
from automation.whbp.paths import repo_root

cfg_path = Path(sys.argv[1])
if not cfg_path.is_absolute():
    cfg_path = repo_root() / cfg_path
cfg = load_yaml(cfg_path)
compose_file = sys.argv[2]
compose_dir = sys.argv[3]
env_file = sys.argv[4]
base = ["docker", "compose", "-f", compose_file, "--env-file", env_file]
failed = []

proc = subprocess.run(base + ["ps", "--services"], capture_output=True, text=True, cwd=compose_dir)
for svc in [s for s in proc.stdout.split() if s]:
    st = subprocess.run(base + ["ps", "--status", "running", svc], cwd=compose_dir)
    if st.returncode != 0:
        failed.append(f"{svc}:not_running")

import urllib.request
try:
    urllib.request.urlopen("http://127.0.0.1/healthz", timeout=5)
except Exception as exc:
    failed.append(f"proxy_http:{exc}")

if cfg.get("backend", {}).get("enabled"):
    be_dom = cfg.get("domains", {}).get("backend", "localhost")
    try:
        req = urllib.request.Request("http://127.0.0.1/health", headers={"Host": be_dom})
        urllib.request.urlopen(req, timeout=5)
    except Exception as exc:
        failed.append(f"backend_health:{exc}")

if failed:
    print("FAIL", failed)
    sys.exit(1)
print("PASS")
PY
