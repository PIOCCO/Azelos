#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export BCBP_ROOT="${ROOT}"
export BCBP_MOCK_MODE=true
export PYTHONPATH="${ROOT}"

# restore with invalid recovery point must fail
if "${ROOT}/scripts/restore.sh" invalid; then
  echo "Expected restore to fail"
  exit 1
fi
echo "Failed recovery test passed"
