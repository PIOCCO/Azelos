#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="${ROOT}:${PYTHONPATH:-}"
CONFIG="${SOC2BP_CLIENT_CONFIG:-${ROOT}/config/clients/example.yaml}"
SOC2BP_MOCK_MODE="${SOC2BP_MOCK_MODE:-true}" python3 "${ROOT}/automation/soc2/collect_evidence.py" --config "${CONFIG}"
