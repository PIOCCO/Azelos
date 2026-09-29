# Web UI — fix “This site can’t be reached”

The UI is **not** hosted on the internet. It runs **on your computer** after you start it.

You must use **`http://`** (not `https://`).

---

## Option A — One address (easiest): **http://127.0.0.1:8000**

Works after a production build; API and UI share port **8000**.

### Linux / macOS

```bash
cd Azelos_DORA_BP
git pull   # ensure package.json includes lucide-react
chmod +x scripts/start-web-one-port.sh
./scripts/start-web-one-port.sh
```

If you see `Cannot find module 'lucide-react'`, run once:

```bash
cd Azelos_DORA_BP/frontend && npm install && cd .. && ./scripts/start-web-one-port.sh
```

### Windows (PowerShell)

```powershell
cd Azelos_DORA_BP
.\scripts\start-web-one-port.ps1
```

Open: **http://127.0.0.1:8000** (not `:5173` for one-port mode)  
Login: `admin@demo.bank` / `ChangeMeNow!`

**Wait until the terminal shows** `Uvicorn running on http://127.0.0.1:8000` **before** opening the browser.

**Keep the terminal window open.** If you close it, the browser shows `ERR_CONNECTION_REFUSED`.

### Already built? Start server only

```bash
chmod +x scripts/run-server.sh
./scripts/run-server.sh
```

Windows: double-click `scripts\run-server.cmd` or run `start-web-one-port.cmd`.

---

## ERR_CONNECTION_REFUSED

| Cause | Fix |
|--------|-----|
| Server not running | Run `./scripts/start-web-one-port.sh` or `./scripts/run-server.sh` |
| Terminal closed | Re-run script; leave window open |
| Wrong URL | One-port: **http://127.0.0.1:8000** — Dev mode: **http://127.0.0.1:5173** |
| Build failed earlier | `cd frontend && npm install && npm run build` — fix errors, then `run-server.sh` |
| Postgres down | Start DB; check `backend/.env` `DATABASE_URL` port **5433** (Docker) or **5432** (local) |

Check:

```bash
curl -s http://127.0.0.1:8000/health
```

Should print `{"status":"alive"}`. If `curl` fails, the browser will too.

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
