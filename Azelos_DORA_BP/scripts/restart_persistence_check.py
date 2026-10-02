#!/usr/bin/env python3
"""After acceptance_validation.py, verify data survives re-login (post-restart manual step)."""

import json
import os
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
marker = ROOT / ".acceptance-marker"
BASE = os.environ.get("ACCEPTANCE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")

if not marker.is_file():
    print("FAIL: no .acceptance-marker — run acceptance_validation.py first")
    sys.exit(1)

data = json.loads(marker.read_text())
suffix = data["suffix"]
email = data["admin_email"]
password = data.get("admin_password", "PilotAdminPass12!")
org_id = data.get("organization_id")

client = httpx.Client(base_url=BASE, timeout=30)
login = client.post(
    "/api/v1/auth/login",
    json={"email": email, "password": password, "organization_id": org_id},
)
if login.status_code != 200:
    print("FAIL login", login.text)
    sys.exit(1)
token = login.json()["access_token"]
org = login.json()["organization_id"]
h = {"Authorization": f"Bearer {token}"}
providers = client.get("/api/v1/ict-providers", headers=h).json()
contracts = client.get("/api/v1/contracts", headers=h).json()
risks = client.get("/api/v1/risks", headers=h).json()
evidence = client.get("/api/v1/evidence", headers=h).json()
ok = (
    providers.get("total", 0) >= 1
    and contracts.get("total", 0) >= 1
    and risks.get("total", 0) >= 1
    and evidence.get("total", 0) >= 1
    and suffix in str(providers)
)
print("PASS restart persistence check" if ok else "FAIL restart persistence check")
print(json.dumps({"providers": providers.get("total"), "contracts": contracts.get("total"), "org": org}, indent=2))
sys.exit(0 if ok else 1)
