@echo off
cd /d "%~dp0.."
set SERVE_FRONTEND=1
cd backend
if exist .venv\Scripts\uvicorn.exe (
  echo Open http://127.0.0.1:8000 — keep this window open.
  .venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000
) else (
  echo Run start-web-one-port.ps1 first to create venv and build frontend.
  pause
)
