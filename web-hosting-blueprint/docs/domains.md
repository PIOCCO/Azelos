# Domains

Set `domains.frontend` and `domains.backend` in client config — never hardcoded in Nginx templates.

Development: use `*.local` hosts and `/etc/hosts` entries pointing to server IP.

Production: DNS A/AAAA records to proxy public IP; enable SSL after certificates are installed.
