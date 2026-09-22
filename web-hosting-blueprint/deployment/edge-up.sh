#!/usr/bin/env bash
# Bring up the shared Traefik edge proxy for multi-client single-host hosting.
# Run once per host; individual clients (hosting.shared_proxy: true) attach to it.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
load_env

command -v docker >/dev/null 2>&1 || die "docker is required"
docker compose version >/dev/null 2>&1 || die "docker compose v2 is required"

EDGE_DIR="${WHBP_ROOT}/.generated/edge"
COMPOSE="${EDGE_DIR}/docker-compose.yml"

# Create the shared edge network first so both Traefik and client stacks can join it.
if ! docker network inspect "${WHBP_EDGE_NETWORK:-whbp_edge}" >/dev/null 2>&1; then
  log "Creating edge network ${WHBP_EDGE_NETWORK:-whbp_edge}"
  docker network create "${WHBP_EDGE_NETWORK:-whbp_edge}" >/dev/null
fi

# Traefik v3.7 negotiates the Docker API version with the host daemon. Only pin
# it (export WHBP_DOCKER_API_VERSION) if you run an older Traefik that falls back
# to an API version the daemon rejects.
log "Rendering Traefik edge stack (acme=${WHBP_TRAEFIK_ACME:-false} dashboard=${WHBP_TRAEFIK_DASHBOARD:-false})"
python3 "${WHBP_ROOT}/automation/whbp/render_edge.py" --output "${COMPOSE}" >/dev/null

if [[ "${WHBP_DRY_RUN:-false}" == "true" ]]; then
  log "DRY RUN: validating edge compose"
  docker compose -f "${COMPOSE}" config >/dev/null
  exit 0
fi

log "Starting Traefik edge proxy"
docker compose -f "${COMPOSE}" up -d

log "Edge proxy is up. Deploy clients with hosting.shared_proxy: true"
