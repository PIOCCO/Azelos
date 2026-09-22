# Deployment

```bash
export WHBP_CLIENT_CONFIG=config/clients/demo-react-node.yaml
export WHBP_POSTGRES_PASSWORD=devpass
./deployment/deploy.sh [version-tag]
```

On health failure, deploy triggers `rollback.sh previous`.

## Multiple clients on one host (shared Traefik proxy)

Set `hosting.shared_proxy: true` on each client, then start the shared proxy once
per host and deploy clients as usual:

```bash
# once per host
export WHBP_TRAEFIK_ACME=true WHBP_ACME_EMAIL=ops@example.com   # optional: Let's Encrypt
./deployment/edge-up.sh

# per client (distinct domains)
WHBP_CLIENT_CONFIG=config/clients/demo-shared-a.yaml ./deployment/deploy.sh
WHBP_CLIENT_CONFIG=config/clients/demo-shared-b.yaml ./deployment/deploy.sh
```

Each client runs as its own isolated Compose project; Traefik routes to it by the
`domains.*` Host header. Stop the proxy with `./deployment/edge-down.sh`. See
`docs/traefik.md` for details.

## Rollback

```bash
./deployment/rollback.sh previous        # interactive YES
./deployment/rollback.sh v1.2.3 --yes    # explicit version
WHBP_DRY_RUN=true ./deployment/rollback.sh previous
```

## Production

```bash
export WHBP_PRODUCTION_APPROVED=true
./deployment/deploy.sh
```

CI production job requires manual `workflow_dispatch` approval.
