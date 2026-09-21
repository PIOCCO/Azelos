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

In a **dedicated lab** with written approval, teams often use **[THC-Hydra](https://github.com/vanhauser-thc/thc-hydra)** (public, not “dark web”). Hydra sends parallel login attempts; you supply the candidate list.

### Prepare candidates (this repo)

```bash
python3 baseline_audit.py demo-emails.csv --baseline example-baseline.txt --candidates-out candidates.csv
python3 export_hydra_c.py candidates.csv -o hydra-C.txt
```

Or from the pattern bot:

```bash
python3 demo_password_bot.py demo-emails.csv --base-email known@lab.local --base-password 'KnownPass!' --output pairs.csv --format csv
python3 export_hydra_c.py pairs.csv -o hydra-C.txt
```

### Run Hydra (you / AppSec on lab targets only)

Install or Docker (`docker pull vanhauser/hydra`). Syntax depends on **protocol** — see `hydra -h` and `hydra -U <module>`.

Generic shape (example service types only; replace with your lab module):

```bash
# One pair file, many predefined user:password lines (good for baseline-derived per-user passwords)
hydra -C hydra-C.txt -o hydra-results.txt -b text TARGET SERVICE

# HTTP form logins need module-specific path and field names from hydra -U http-post-form
```

Use **low parallelism** (`-t 4` or per AppSec), watch lockouts, and keep `-o` logs for the internship report.

### Still prefer offline when possible

Hash export + `baseline_audit.py --hashes` answers the same risk question without touching the login endpoint.
