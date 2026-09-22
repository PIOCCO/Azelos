#!/usr/bin/env bash
# Stop the shared Traefik edge proxy. Client stacks are left untouched.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
load_env

command -v docker >/dev/null 2>&1 || die "docker is required"

COMPOSE="${WHBP_ROOT}/.generated/edge/docker-compose.yml"
[[ -f "${COMPOSE}" ]] || die "Edge stack not rendered — nothing to stop (run edge-up.sh first)"

log "Stopping Traefik edge proxy"
docker compose -f "${COMPOSE}" down --remove-orphans

log "Edge proxy stopped. The ${WHBP_EDGE_NETWORK:-whbp_edge} network is left in place for running clients."
