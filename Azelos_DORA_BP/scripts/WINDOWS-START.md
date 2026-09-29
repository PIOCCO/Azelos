# Windows: fix ERR_CONNECTION_REFUSED

`ERR_CONNECTION_REFUSED` means **no program is listening on port 8000 on your PC at that moment**.

The server from a **Cursor Cloud Agent** runs in the cloud — your browser on your laptop **cannot** use that agent’s `127.0.0.1`.

## Step 1 — Diagnose

PowerShell:

```powershell
cd Azelos_DORA_BP
.\scripts\diagnose-connection.ps1
```

If **Port 8000: CLOSED**, the browser will always fail until you start the server locally.

## Step 2 — Start (keep window open)

```powershell
cd Azelos_DORA_BP
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\start-web-one-port.ps1
```

Wait until you see:

```text
Uvicorn running on http://0.0.0.0:8000
```

**Do not close this PowerShell window.**

## Step 3 — Browser

Try **both**:

- http://localhost:8000
- http://127.0.0.1:8000

Use **http** (not https).

Login: `admin@demo.bank` / `ChangeMeNow!`

## WSL (Git Bash) on Windows

If you start the server **inside WSL** but use **Chrome on Windows**, try http://localhost:8000. If it still fails, run the PowerShell script **from Windows** (not WSL), or use:

```bash
cd /mnt/c/.../Azelos_DORA_BP
./scripts/start-web-one-port.sh
```

and test from a browser inside WSL, or bind `0.0.0.0` (scripts already do).

## Manual two-step (if script fails)

```powershell
cd Azelos_DORA_BP\frontend
npm install
npm run build

cd ..\backend
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
$env:SERVE_FRONTEND = "1"
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000
```

While uvicorn runs, in **another** PowerShell:

```powershell
Invoke-WebRequest http://localhost:8000/health
```

If that works, the browser will work too.
