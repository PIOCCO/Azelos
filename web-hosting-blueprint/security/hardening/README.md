# Server hardening

Apply on VPS/Azure VM before production:

- SSH key-only auth, disable root login
- `ufw allow 22,80,443/tcp` — document any extra ports before opening
- Unattended security updates (Ubuntu)
- Fail2ban optional

Document exposed ports per client in handover notes.
