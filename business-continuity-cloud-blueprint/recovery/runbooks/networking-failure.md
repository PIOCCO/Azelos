# Runbook: Networking Failure

| Runbook ID | RB-NET-001 |

## Detection

- VNet/subnet NSG deny rules, DNS resolution failures in `health-check.sh`
- Private endpoint disconnect

## Containment

- Roll back recent NSG/firewall Terraform changes
- Fail over to public endpoint temporarily only if risk accepted

## Recovery

- Redeploy networking module from known-good Git revision
- Validate peering and DNS

## Evidence

- Activity logs, health-check JSON
