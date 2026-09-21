# Password baseline assessment (authorized private test)

Use this for an **enterprise internship / security exercise** when leadership wants to know whether **demo accounts still match an old password baseline** (predictable patterns, reused defaults).

## What this repo supports

| Approach | Tool | Live login attempts? |
|----------|------|----------------------|
| Pattern + known sample | `demo_password_bot.py` | No |
| Baseline patterns × email list | `baseline_audit.py` | No |
| Check against internal hash export | `baseline_audit.py --hashes` | No |

**We do not ship login trial-and-error.** Even in a private lab, spraying passwords against SSO creates lockouts, audit noise, and tooling that is easy to misuse. Mature programs usually:

1. Generate **candidates** from the approved baseline (this repo).
2. Verify **offline** against hashes from a **scoped export** (AD `Get-ADUser` hash for test OU, app DB audit column, etc.).
3. Run **live** authentication tests only via the **red team / AppSec** playbook (rate limits, break-glass account, written scope).

## Before you start (deliverable checklist)

- [ ] Written authorization (manager + AppSec): scope, systems, date window, account OU/tenant
- [ ] Test environment ID (not production unless explicitly in scope)
- [ ] Baseline document: old patterns, default passwords, policy from 20xx
- [ ] Hash export method approved by AppSec (never email plaintext passwords)

## Workflow on Ubuntu

```bash
cd tools/demo-credential-generator

# 1) Build all baseline candidates for demo emails
python3 baseline_audit.py demo-emails.csv \
  --baseline example-baseline.txt \
  --candidates-out all-candidates.csv

# 2) Compare to hash export from security team (csv: email,hash,algorithm)
python3 baseline_audit.py demo-emails.csv \
  --baseline example-baseline.txt \
  --hashes test-ou-hashes.csv \
  --matches-out weak-matches.csv
```

`algorithm` column: `sha256`, `md5`, or `plain` (plain only for isolated lab fixtures).

## Interpreting results for management

Report **counts**, not password lists in slides:

- Accounts tested: N  
- Baseline patterns evaluated: M  
- Candidates generated: N × M (approx.)  
- **Matches** (would be vulnerable if baseline still allowed): K  
- **Rate**: K / N as “baseline exposure rate” in the test OU  

Recommendations: enforce unique passwords, block patterns in AD password filter, rotate demo creds, MFA on demo tenant if realistic attack path.

## If leadership requires live login verification

Ask AppSec to run an **in-scope password spray** with commercial/red-team tools, captcha/MFA behavior documented, and your intern role as **observer + candidate list provider** (export from `baseline_audit.py`), not operator of brute-force against production SSO.
