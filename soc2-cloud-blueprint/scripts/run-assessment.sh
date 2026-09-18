#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="${ROOT}:${PYTHONPATH:-}"
CONFIG="${SOC2BP_CLIENT_CONFIG:-${ROOT}/config/clients/example.yaml}"
MOCK="${SOC2BP_MOCK_MODE:-true}"
python3 "${ROOT}/automation/soc2/gap_analysis.py" --config "${CONFIG}" --output "${ROOT}/gap-analysis.json" ${MOCK:+--mock}
exit $?
