# SOC 2 Cloud Compliance Blueprint

Reusable **SOC 2 readiness and continuous compliance** system for cloud-hosted businesses — **not** an auditor and **not** a SOC 2 report.

> Monorepo sibling folders: `business-continuity-cloud-blueprint/`, `web-hosting-blueprint/`. Optional integration via inventory JSON paths in `client.yaml`.

## Compliance principle

Distinguish:

```text
Control exists → implemented → operating → evidence collected → evidence sufficient → independently audited
```

Automation supports readiness, implementation, evidence, monitoring, and remediation prep — **it does not certify compliance**.

## Quick start

```bash
cd soc2-cloud-blueprint
pip install -r requirements.txt
export SOC2BP_CLIENT_CONFIG=config/clients/example.yaml
export SOC2BP_MOCK_MODE=true

./scripts/validate-config.sh
./scripts/run-assessment.sh
./scripts/collect-evidence.sh
./scripts/readiness-report.sh
```

## Configure criteria

Edit `config/clients/<client>.yaml`:

```yaml
soc2:
  criteria:
    security: true          # required baseline
    availability: true
    processing_integrity: false
    confidentiality: true
    privacy: false
```

Controls in scope are filtered from `config/controls.yaml` automatically.

## Documentation

- `docs/soc2-overview.md`
- `docs/client-onboarding.md`
- `docs/control-framework.md`
- `docs/gap-assessment.md`
- `docs/architecture.md`

## License

MIT
