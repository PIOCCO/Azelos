#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MATCHES="$(rg -n -i "BEGIN RSA PRIVATE KEY|AWS_SECRET_ACCESS_KEY" "${ROOT}/config" "${ROOT}/deployment" "${ROOT}/automation" 2>/dev/null || true)"
if [[ -n "${MATCHES}" ]]; then
  echo "Secret pattern detected:"
  echo "${MATCHES}"
  exit 1
fi
exit 0
