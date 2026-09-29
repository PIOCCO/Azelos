# Diagnose ERR_CONNECTION_REFUSED for DORA Blueprint (Windows PowerShell)
$ErrorActionPreference = "Continue"
Write-Host "=== DORA connection diagnose ===" -ForegroundColor Cyan
Write-Host ""

function Test-Port($port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect("127.0.0.1", $port)
        $c.Close()
        return $true
    } catch { return $false }
}

foreach ($p in 5432, 5433, 8000, 5173) {
    $ok = Test-Port $p
    Write-Host ("Port {0}: {1}" -f $p, $(if ($ok) { "OPEN (something is listening)" } else { "CLOSED (connection refused if browser uses this)" }))
}

Write-Host ""
Write-Host "HTTP checks:" -ForegroundColor Cyan
try {
    $h = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  http://127.0.0.1:8000/health -> $($h.StatusCode) $($h.Content)"
} catch {
    Write-Host "  http://127.0.0.1:8000/health -> FAILED ($($_.Exception.Message))"
}
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  http://localhost:8000/health   -> $($r.StatusCode)"
} catch {
    Write-Host "  http://localhost:8000/health   -> FAILED"
}

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dist = Join-Path $Root "frontend\dist\index.html"
Write-Host ""
Write-Host "Frontend build:" $(if (Test-Path $dist) { "OK ($dist)" } else { "MISSING — run: cd frontend; npm install; npm run build" })

Write-Host ""
Write-Host "If port 8000 is CLOSED:" -ForegroundColor Yellow
Write-Host "  1. Open a NEW PowerShell window"
Write-Host "  2. cd $Root"
Write-Host "  3. .\scripts\start-web-one-port.ps1"
Write-Host "  4. Wait for: Uvicorn running on http://0.0.0.0:8000"
Write-Host "  5. Leave that window OPEN; then open http://localhost:8000"
Write-Host ""
Write-Host "127.0.0.1 only works on THIS PC while the server window is running." -ForegroundColor Yellow
Write-Host "Cursor Cloud Agent logs do NOT start a server on your laptop." -ForegroundColor Yellow
Read-Host "Press Enter to close"
