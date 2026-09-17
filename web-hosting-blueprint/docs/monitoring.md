# Monitoring

- Proxy: `GET /healthz`
- Backend: configured `health_endpoint` via Host routing
- Containers: Docker healthchecks + labels (`client`, `application`, `environment`, `service`)
- Host metrics: install node_exporter or Azure Monitor VM extension (optional)

Deployment status: `reports/deployments/deploy-*.json`
