# Client Onboarding

## Workflow

```text
Client → Application assessment → Choose profile → Configure client.yaml
→ Validate → Provision server (Terraform/VPS) → Deploy → DNS → HTTPS
→ Health checks → Monitoring → Backup → Handover
```

## Checklist

- [ ] Identify frontend/backend/database/redis requirements
- [ ] Copy `config/client.example.yaml` → `config/clients/<client-id>.yaml`
- [ ] Set `client.id` (unique, lowercase hyphenated)
- [ ] Choose `hosting.profile` (small | standard | resilient)
- [ ] Point `frontend.source.build_context` / `backend.source.build_context` at client repo path
- [ ] Set domains and SSL contacts
- [ ] Store secrets in `.env` or external vault — never in Git
- [ ] `./deployment/validate-config.sh`
- [ ] `./deployment/deploy.sh`
- [ ] Configure DNS to server IP
- [ ] Enable TLS (`ssl.enabled`, certs under `.generated/.../nginx/certs/`)
- [ ] `./deployment/health-check.sh`
- [ ] Schedule `backup/scripts/backup.sh`
- [ ] Deliver runbooks and monitoring endpoints

## Hosting as a service (future)

Automation is CLI-driven today so a future dashboard can orchestrate the same steps without rewriting deployment logic.
