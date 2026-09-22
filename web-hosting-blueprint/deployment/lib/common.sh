#!/usr/bin/env bash
set -euo pipefail

WHBP_ROOT="${WHBP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
export PYTHONPATH="${WHBP_ROOT}:${PYTHONPATH:-}"
WHBP_CLIENT_CONFIG="${WHBP_CLIENT_CONFIG:-${WHBP_ROOT}/config/clients/demo-static.yaml}"
WHBP_ENV="${WHBP_ENV:-development}"
WHBP_DRY_RUN="${WHBP_DRY_RUN:-false}"
WHBP_REPORT_DIR="${WHBP_ROOT}/reports/deployments"

log() { echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*"; }
die() { log "ERROR: $*"; exit "${WHBP_EXIT_CODE:-1}"; }

load_env() {
  if [[ -f "${WHBP_ROOT}/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${WHBP_ROOT}/.env"
    set +a
  fi
}

validate_config() {
  python3 "${WHBP_ROOT}/automation/whbp/validate.py" --config "${WHBP_CLIENT_CONFIG}"
}

render_stack() {
  python3 "${WHBP_ROOT}/automation/whbp/render.py" --config "${WHBP_CLIENT_CONFIG}"
}

WHBP_EDGE_NETWORK="${WHBP_EDGE_NETWORK:-whbp_edge}"

is_shared_proxy() {
  python3 - "${WHBP_CLIENT_CONFIG}" <<'PY'
import sys
from pathlib import Path
from automation.whbp.config_loader import load_yaml
from automation.whbp.paths import repo_root
p = Path(sys.argv[1])
if not p.is_absolute():
    p = repo_root() / p
cfg = load_yaml(p)
sys.exit(0 if cfg.get("hosting", {}).get("shared_proxy", False) else 1)
PY
}

ensure_edge_network() {
  if ! docker network inspect "${WHBP_EDGE_NETWORK}" >/dev/null 2>&1; then
    log "Creating shared edge network ${WHBP_EDGE_NETWORK}"
    docker network create "${WHBP_EDGE_NETWORK}" >/dev/null
  fi
}

generated_dir() {
  python3 - "${WHBP_CLIENT_CONFIG}" <<'PY'
import sys
from pathlib import Path
from automation.whbp.config_loader import load_yaml
from automation.whbp.render import generated_dir
root = Path(sys.argv[1]).parents[0]
cfg_path = Path(sys.argv[1])
if not cfg_path.is_absolute():
    cfg_path = root / "config/clients" / cfg_path.name if False else Path(sys.argv[1])
from automation.whbp.paths import repo_root
import yaml
p = Path(sys.argv[1])
if not p.is_absolute():
    p = repo_root() / p
cfg = load_yaml(p)
print(generated_dir(cfg))
PY
}

history_file() {
  local gen
  gen="$(render_stack)"
  echo "${gen}/deployment-history.json"
}

record_deployment() {
  local version="$1"
  local hf
  hf="$(history_file)"
  mkdir -p "$(dirname "${hf}")"
  python3 - "${hf}" "${version}" <<'PY'
import json, sys, datetime
path, version = sys.argv[1], sys.argv[2]
try:
    data = json.load(open(path))
except FileNotFoundError:
    data = {"deployments": []}
data["deployments"].append({"version": version, "timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat()})
json.dump(data, open(path, "w"), indent=2)
PY
}
