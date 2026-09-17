# Security

- Non-root users in example Dockerfiles where supported
- Backend not published on host ports — only `proxy` exposes 80/443
- PostgreSQL/Redis exposed on Docker internal network only
- Security headers via `proxy/nginx/snippets/security-headers.conf`
- `security/scanning/secret-scan.sh` in CI
- Optional `trivy` compose config scan in `security/scanning/scan-images.sh`
- SSH/firewall hardening templates under `security/hardening/` (apply on VPS manually)

Never commit private keys, certificates, or production passwords.
