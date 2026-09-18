#!/usr/bin/env bash
# Lightweight security gate — extend with trivy/grype in CI when available.
set -euo pipefail
GEN="${1:-}"
[[ -n "${GEN}" ]] || exit 0
if command -v trivy >/dev/null 2>&1; then
  trivy config "${GEN}/docker-compose.yml" --severity HIGH,CRITICAL --exit-code 1
fi
exit 0
