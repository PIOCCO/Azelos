#!/usr/bin/env python3
"""Verify Nordhaven pilot demo chain via API (same data the UI uses)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import httpx

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))

BASE = os.environ.get("ACCEPTANCE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
EMAIL = "pilot.admin@pilot-demo.example"
PASSWORD = "PilotDemoAdmin12!"
PILOT_NAME = "Nordhaven Mutual Bank AG (Pilot Demo)"


def main() -> int:
    from sqlalchemy import select

    from app.database.session import SessionLocal
    from app.models.financial_entity import FinancialEntity

    session = SessionLocal()
    org = session.scalar(select(FinancialEntity).where(FinancialEntity.legal_name == PILOT_NAME))
    session.close()
    if org is None:
        print("FAIL: demo tenant missing — run seed_pilot_demo.py")
        return 1

    c = httpx.Client(base_url=BASE, timeout=60)
    login = c.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD, "organization_id": str(org.id)},
    )
    if login.status_code != 200:
        print("FAIL login", login.status_code, login.text)
        return 1
    h = {"Authorization": f"Bearer {login.json()['access_token']}"}

    checks: list[tuple[str, bool, str]] = []

    def ok(name: str, cond: bool, detail: str = "") -> None:
        checks.append((name, cond, detail))

    providers = c.get("/api/v1/ict-providers", headers=h).json()
    pc = next((p for p in providers.get("items", []) if "PaymentClear" in p.get("legal_name", "")), None)
    ok("Provider PaymentClear", pc is not None, str(providers.get("total")))

    contracts = c.get("/api/v1/contracts", headers=h).json()
    pay_ctr = next(
        (x for x in contracts.get("items", []) if x.get("reference_number") == "NH-ICT-2024-PAY-001"),
        None,
    )
    ok("Contract NH-ICT-2024-PAY-001", pay_ctr is not None)

    services = c.get("/api/v1/ict-services", headers=h).json()
    pay_svc = next(
        (s for s in services.get("items", []) if "SEPA" in s.get("name", "")), None
    )
    ok("ICT Service SEPA", pay_svc is not None)

    bfs = c.get("/api/v1/business-functions", headers=h).json()
    pay_bf = next((b for b in bfs.get("items", []) if "SEPA" in b.get("name", "")), None)
    ok("Critical function SEPA", pay_bf is not None)

    assets = c.get("/api/v1/ict-assets", headers=h).json()
    ok("ICT asset", assets.get("total", 0) >= 1)

    risks = c.get("/api/v1/risks", headers=h).json()
    ok("Risk assessments", risks.get("total", 0) >= 1)

    reqs = c.get(f"/api/v1/organizations/{org.id}/requirements", headers=h).json()
    in_prog = [r for r in reqs if r.get("implementation_status") != "not_started"]
    ok("Requirement in progress", len(in_prog) >= 1)

    evidence = c.get("/api/v1/evidence", headers=h).json()
    ev0 = evidence.get("items", [{}])[0] if evidence.get("items") else None
    ok("Evidence metadata", evidence.get("total", 0) >= 1)
    if ev0:
        dl = c.get(f"/api/v1/evidence/{ev0['id']}/download", headers=h)
        ok("Evidence download", dl.status_code == 200 and len(dl.content) > 0, str(dl.status_code))

    inc = c.get("/api/v1/incidents", headers=h).json()
    ok("Incidents", inc.get("total", 0) >= 1)

    rt = c.get("/api/v1/resilience-tests", headers=h).json()
    ok("Resilience tests", rt.get("total", 0) >= 1)

    bcp = c.get("/api/v1/business-continuity", headers=h).json()
    ok("BCP records", bcp.get("total", 0) >= 1)

    gql = c.post(
        "/graphql",
        headers=h,
        json={"query": "{ organizationGraph(depth: 2) { nodes { id label } edges { id } } }"},
    )
    nodes = (gql.json().get("data") or {}).get("organizationGraph", {}).get("nodes") or []
    ok("Relationship map GraphQL", len(nodes) >= 5, f"nodes={len(nodes)}")

    dash = c.get("/api/v1/dora/overview", headers=h)
    ok("Dashboard/DORA overview", dash.status_code == 200 and dash.json().get("ict_providers_total", 0) >= 3)

    report = c.get("/api/v1/resilience/reports/dora-assessment", headers=h)
    ok("Report dora-assessment", report.status_code == 200)

    csv = c.get("/api/v1/export/ict-providers.csv", headers=h)
    ok("Export providers CSV", csv.status_code == 200 and "PaymentClear" in csv.text)

    zip_export = c.get("/api/v1/tenant/data/export", headers=h)
    ok("Tenant ZIP export", zip_export.status_code == 200, str(zip_export.status_code))

    for name, passed, detail in checks:
        print(f"[{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

    failed = sum(1 for _, p, _ in checks if not p)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
