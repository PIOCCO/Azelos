#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="${ROOT}:${PYTHONPATH:-}"
CONFIG="${SOC2BP_CLIENT_CONFIG:-${ROOT}/config/clients/example.yaml}"
python3 "${ROOT}/automation/soc2/validate_config.py" --config "${CONFIG}"
