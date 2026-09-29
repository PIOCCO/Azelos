@echo off
REM One-port UI + API on http://127.0.0.1:8000 (Windows)
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-web-one-port.ps1"
pause
