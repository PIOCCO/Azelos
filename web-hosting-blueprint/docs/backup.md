# Backup

```bash
WHBP_CLIENT_CONFIG=config/clients/demo-react-node.yaml ./backup/scripts/backup.sh
./backup/scripts/restore.sh backup/storage/backup-.../database.sql
```

Verify backup directory contains `verified.txt` after pg_dump.

Retention policy is client-specific — automate with cron/systemd timer on VPS.
