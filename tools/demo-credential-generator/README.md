# Demo credential generator

Generates **passwords from a pattern** for a list of **emails** you already control (dev/demo/staging).

## What this is NOT

- Not password **cracking** or **recovery** for unknown accounts  
- Not for use against real users without explicit authorization  
- Does not read databases or breach data — only applies **your** pattern template

## Bot: learn pattern from known accounts

If you know the password for **one or two** demo users and the rest follow the same rule:

```bash
python demo_password_bot.py example-emails.txt \
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

## Security

Store output CSV securely; delete when demo is torn down. Use unique passwords per environment in production.
