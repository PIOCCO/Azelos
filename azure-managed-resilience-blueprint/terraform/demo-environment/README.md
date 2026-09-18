# Demo customer environment (optional)

Deploy **only when testing live discovery** against real Azure APIs. Estimated extra cost: ~$30–80/month if VMs run 24/7 — **deallocate VMs when idle**.

Suggested resources (separate resource group):

- 2–3 × `Standard_B1s` Linux VMs (one without backup policy)
- Storage account, VNet, NSG
- Recovery Services vault + one protected VM
- Log Analytics + VM insights on one VM only

Intentional safe misconfigurations for the platform to detect:

- VM without backup
- Idle/deallocated VM still incurring disk/IP cost
- Metric alert for high CPU test (manual stress)
- Missing diagnostics on one resource

Do **not** expose databases to the public internet for demo purposes.

After deploy, set `AZURE_MOCK=false`, assign API identity roles from `docs/AZURE_PERMISSIONS.md`, and implement `_fetch_live` in `azure/collectors/sync.py`.
