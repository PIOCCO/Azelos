# Web UI — fix “This site can’t be reached”

The UI is **not** hosted on the internet. It runs **on your computer** after you start it.

You must use **`http://`** (not `https://`).

---

## Option A — One address (easiest): **http://127.0.0.1:8000**

Works after a production build; API and UI share port **8000**.

### Linux / macOS

```bash
cd Azelos_DORA_BP
chmod +x scripts/start-web-one-port.sh
./scripts/start-web-one-port.sh
```

### Windows (PowerShell)

```powershell
cd Azelos_DORA_BP
.\scripts\start-web-one-port.ps1
```

Open: **http://127.0.0.1:8000**  
Login: `admin@demo.bank` / `ChangeMeNow!`

---

## Option B — Dev mode: UI **5173** + API **8000**

Two terminals (or `scripts/dev-local.sh` on Linux/macOS).

**Terminal 1 — API**

```bash
cd Azelos_DORA_BP/backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -e ".[dev]"
cp ../.env.example .env
# If NOT using Docker: change 5433 → 5432 in .env DATABASE_URL
python -m alembic upgrade head
python scripts/seed_dev.py
python scripts/seed_api_user.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — UI**

```bash
cd Azelos_DORA_BP/frontend
npm install
npm run dev
```

Open: **http://127.0.0.1:5173**

---

## Database

| Setup | `DATABASE_URL` port |
|--------|---------------------|
| `docker compose up -d postgres` | **5433** |
| Local PostgreSQL (default install) | **5432** |

If Postgres is down, the API fails and the site may look unreachable or login will error.

---

## Check what is wrong

```bash
cd Azelos_DORA_BP
chmod +x scripts/check-web.sh
./scripts/check-web.sh
```

---

## Still failing?

1. Confirm URL: **http://127.0.0.1:8000** (option A) or **http://127.0.0.1:5173** (option B).
2. Do not use a Cursor Cloud Agent link — that is not your local app.
3. Paste the output of `scripts/check-web.sh` (or the PowerShell check in `start-web-one-port.ps1`).
