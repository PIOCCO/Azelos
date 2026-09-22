# SSL/TLS

## Dedicated proxy (`hosting.shared_proxy: false`)

1. Set `ssl.enabled: true` and valid domains in client config.
2. Place certificates in `.generated/<project>/nginx/certs/fullchain.pem` and `privkey.pem`.
3. Use Certbot on the host or ACME sidecar — not committed to Git.

HTTP redirects to HTTPS in generated Nginx config.

Defaults: TLS 1.2+, modern cipher suites via Nginx base image.

## Shared proxy (`hosting.shared_proxy: true`)

Traefik terminates TLS centrally and can obtain Let's Encrypt certificates
automatically per domain. Enable ACME when starting the edge proxy:

```bash
export WHBP_TRAEFIK_ACME=true
export WHBP_ACME_EMAIL=ops@example.com
export WHBP_ACME_STAGING=true   # optional: use the LE staging CA while testing
./deployment/edge-up.sh
```

With `ssl.enabled: true`, each client's Traefik router uses the `letsencrypt`
resolver and HTTP→HTTPS redirection is enabled globally. Certificates persist in
the edge stack's `acme` volume. Public DNS for each domain must point at the host
for the HTTP-01 challenge to succeed. See `docs/traefik.md`.
