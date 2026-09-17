# SSL/TLS

1. Set `ssl.enabled: true` and valid domains in client config.
2. Place certificates in `.generated/<project>/nginx/certs/fullchain.pem` and `privkey.pem`.
3. Use Certbot on the host or ACME sidecar — not committed to Git.

HTTP redirects to HTTPS in generated Nginx config.

Defaults: TLS 1.2+, modern cipher suites via Nginx base image.
