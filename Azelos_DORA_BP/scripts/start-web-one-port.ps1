# One-port DORA UI + API on http://127.0.0.1:8000
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

function Test-Port($p) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect("127.0.0.1", $p)
        $c.Close()
        return $true
    } catch { return $false }
}

if (-not (Test-Port 5432) -and -not (Test-Port 5433)) {
    Write-Host "ERROR: PostgreSQL not on 5432 or 5433. Start Docker: docker compose up -d postgres"
    exit 1
}

$envFile = Join-Path $Backend ".env"
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $Root ".env.example") $envFile
    if ((Test-Port 5432) -and -not (Test-Port 5433)) {
        (Get-Content $envFile) -replace "5433", "5432" | Set-Content $envFile
    }
}

Set-Location $Backend
$py = Join-Path $Backend ".venv\Scripts\python.exe"
if (-not (Test-Path $py)) { $py = "python" }
& $py -m pip install -e ".[dev]"
& $py -m alembic upgrade head
& $py scripts/seed_dev.py
& $py scripts/seed_api_user.py

Set-Location $Frontend
Write-Host "Installing frontend dependencies (includes lucide-react icons)…"
if (Test-Path "package-lock.json") { npm ci } else { npm install }
npm run build

Write-Host ""
Write-Host "Open: http://127.0.0.1:8000"
Write-Host "Login: admin@demo.bank / ChangeMeNow!"
Write-Host ""

Set-Location $Backend
$env:SERVE_FRONTEND = "1"
$uv = Join-Path $Backend ".venv\Scripts\uvicorn.exe"
if (-not (Test-Path $uv)) { $uv = "uvicorn" }
& $uv app.main:app --host 0.0.0.0 --port 8000
