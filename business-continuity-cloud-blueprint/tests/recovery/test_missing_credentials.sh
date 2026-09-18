#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export BCBP_ROOT="${ROOT}"
export PYTHONPATH="${ROOT}"
unset AZURE_CLIENT_ID AZURE_CLIENT_SECRET AZURE_TENANT_ID || true

if command -v az >/dev/null; then
  # If az is logged in, skip — environment has credentials
  if az account show >/dev/null 2>&1; then
    echo "Skipping missing-credentials test (az session present)"
    exit 0
  fi
fi

if BCBP_MOCK_MODE=false "${ROOT}/scripts/backup.sh"; then
  echo "Expected backup to fail without credentials"
  exit 1
fi
echo "Missing credentials test passed"
