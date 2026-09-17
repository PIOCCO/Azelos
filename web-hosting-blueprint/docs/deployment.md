# Deployment

```bash
export WHBP_CLIENT_CONFIG=config/clients/demo-react-node.yaml
export WHBP_POSTGRES_PASSWORD=devpass
./deployment/deploy.sh [version-tag]
```

On health failure, deploy triggers `rollback.sh previous`.

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
