#!/usr/bin/env python3
"""Production-style acceptance validation against a running API (default http://127.0.0.1:8000)."""

from __future__ import annotations

import json
import os
import sys
import uuid
from datetime import date
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

BASE = os.environ.get("ACCEPTANCE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
RESULTS: list[tuple[str, str, str]] = []


def record(step: str, status: str, detail: str = "") -> None:
    RESULTS.append((step, status, detail))
    print(f"[{status}] {step}" + (f" — {detail}" if detail else ""))


def ensure_platform_super_admin(email: str, password: str) -> str:
    from sqlalchemy import select

    from app.core.passwords import hash_password
    from app.core.rbac import Role
    from app.database.session import SessionLocal
    from app.models.auth import OrganizationMembership, User
    from app.models.financial_entity import FinancialEntity

    session = SessionLocal()
    try:
        user = session.scalar(select(User).where(User.email == email))
        if user is None:
            org = FinancialEntity(legal_name="Platform Ops", country_code="DE", status="active")
            session.add(org)
            session.flush()
            user = User(email=email, hashed_password=hash_password(password), is_active=True)
            session.add(user)
            session.flush()
            session.add(
                OrganizationMembership(
                    user_id=user.id,
                    financial_entity_id=org.id,
                    role=Role.SUPER_ADMIN,
                )
            )
            session.commit()
            return str(org.id)
        mem = session.scalar(
            select(OrganizationMembership).where(OrganizationMembership.user_id == user.id)
        )
        assert mem is not None
        return str(mem.financial_entity_id)
    finally:
        session.close()


def main() -> int:
    client = httpx.Client(base_url=BASE, timeout=60.0)
    try:
        r = client.get("/health")
        record("health", "PASS" if r.status_code == 200 else "FAIL", r.text[:80])
        r = client.get("/ready")
        record("ready", "PASS" if r.status_code == 200 else "FAIL", str(r.status_code))

        for path in ("/", "/login", "/contracts", "/dora/relationship-map", "/onboarding"):
            r = client.get(path)
            ct = r.headers.get("content-type", "")
            ok = r.status_code == 200 and "text/html" in ct
            record(f"SPA route {path}", "PASS" if ok else "FAIL", f"{r.status_code} {ct[:40]}")

        bootstrap_email = f"platform-{uuid.uuid4().hex[:8]}@example.com"
        bootstrap_password = "AcceptPlatform12!"
        platform_org = ensure_platform_super_admin(bootstrap_email, bootstrap_password)

        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": bootstrap_email,
                "password": bootstrap_password,
                "organization_id": platform_org,
            },
        )
        if login.status_code != 200:
            record("platform login", "FAIL", login.text)
            return 1
        sa_token = login.json()["access_token"]
        sa_h = {"Authorization": f"Bearer {sa_token}"}

        suffix = uuid.uuid4().hex[:6]
        admin_email = f"admin.pilot-{suffix}@example.com"
        admin_password = "PilotAdminPass12!"
        prov = client.post(
            "/api/v1/tenant/provision",
            headers=sa_h,
            json={
                "legal_name": f"Pilot Acceptance Bank {suffix}",
                "country_code": "DE",
                "admin_email": admin_email,
                "admin_password": admin_password,
            },
        )
        record("1 provision organization", "PASS" if prov.status_code == 201 else "FAIL", prov.text[:120])
        if prov.status_code != 201:
            return 1
        token = prov.json()["access_token"]
        org_customer = prov.json()["organization_id"]
        h = {"Authorization": f"Bearer {token}"}

        record("2 ORG_ADMIN via provision", "PASS", admin_email)
        record("3 accept invitation", "SKIP", "Admin account created at provision")

        prof = client.patch(
            f"/api/v1/organizations/{org_customer}/profile",
            headers=h,
            json={"organization_type": "credit_institution", "regulatory_status": "authorized"},
        )
        record("6 configure profile", "PASS" if prof.status_code == 200 else "FAIL")
        appl = client.get(f"/api/v1/organizations/{org_customer}/applicability", headers=h)
        record("7 applicability", "PASS" if appl.status_code == 200 else "FAIL")

        provider = client.post(
            "/api/v1/ict-providers",
            headers=h,
            json={"legal_name": f"Outsource Partner {suffix}", "country_code": "DE"},
        )
        record("8 create provider", "PASS" if provider.status_code == 201 else "FAIL")
        pid = provider.json()["id"]

        contract = client.post(
            "/api/v1/contracts",
            headers=h,
            json={
                "provider_id": pid,
                "reference_number": f"PILOT-{suffix}",
                "start_date": str(date.today()),
            },
        )
        record("9 create contract", "PASS" if contract.status_code == 201 else "FAIL")
        cid = contract.json()["id"]

        service = client.post(
            "/api/v1/ict-services",
            headers=h,
            json={"contract_id": cid, "name": f"Core processing {suffix}"},
        )
        record("10 create ICT service", "PASS" if service.status_code == 201 else "FAIL")
        sid = service.json()["id"]

        bf = client.post(
            "/api/v1/business-functions",
            headers=h,
            json={
                "name": f"Payments {suffix}",
                "function_identifier": f"PAY-{suffix}",
                "critical_or_important": "critical",
            },
        )
        record("11 business function", "PASS" if bf.status_code == 201 else "FAIL")

        asset = client.post(
            "/api/v1/ict-assets",
            headers=h,
            json={
                "name": f"Ledger {suffix}",
                "asset_identifier": f"ICT-{suffix}",
                "inherent_criticality": "important",
            },
        )
        record("12 ICT asset", "PASS" if asset.status_code == 201 else "FAIL")

        client.post(
            "/api/v1/dependencies/function-service",
            headers=h,
            json={"business_function_id": bf.json()["id"], "ict_service_id": sid},
        )

        risk = client.post(
            "/api/v1/risks",
            headers=h,
            json={
                "provider_id": pid,
                "contract_id": cid,
                "service_id": sid,
                "title": f"Pilot risk {suffix}",
                "criticality": "medium",
                "data_sensitivity": "medium",
                "substitutability": "medium",
                "concentration_risk": "medium",
                "geographic_risk": "low",
                "security_assurance": "medium",
                "contract_gaps": "low",
                "exit_feasibility": "medium",
                "assessor": admin_email,
            },
        )
        record("13 create risk", "PASS" if risk.status_code == 201 else "FAIL")

        reqs = client.get(f"/api/v1/organizations/{org_customer}/requirements", headers=h)
        if reqs.status_code == 200 and reqs.json():
            rid = reqs.json()[0]["id"]
            patch = client.patch(
                f"/api/v1/organizations/{org_customer}/requirements/{rid}",
                headers=h,
                json={"implementation_status": "in_progress"},
            )
            record("14 requirement status", "PASS" if patch.status_code == 200 else "FAIL")
        else:
            record("14 requirements", "FAIL", "no org requirements")

        dtypes = client.get("/api/v1/evidence/document-types", headers=h)
        record("15 evidence doc types", "PASS" if dtypes.status_code == 200 and dtypes.json() else "FAIL")
        if dtypes.status_code == 200 and dtypes.json():
            dt_id = dtypes.json()[0]["id"]
            up = client.post(
                "/api/v1/evidence/upload",
                headers=h,
                files={"file": ("policy.txt", b"pilot evidence content", "text/plain")},
                data={"document_type_id": dt_id},
            )
            record("15 upload evidence", "PASS" if up.status_code == 201 else "FAIL", up.text[:80])

        inc = client.post(
            "/api/v1/incidents",
            headers=h,
            json={"title": f"Pilot incident {suffix}", "severity": "medium", "is_major": False},
        )
        record("16 incident", "PASS" if inc.status_code == 201 else "FAIL")

        bcp = client.post(
            "/api/v1/business-continuity",
            headers=h,
            json={"name": f"BCP {suffix}"},
        )
        record("17 BCP", "PASS" if bcp.status_code == 201 else "FAIL")

        gql = client.post(
            "/graphql",
            headers=h,
            json={"query": "query { organizationGraph(depth: 1) { nodes { id label } edges { id } } }"},
        )
        gql_body = gql.json()
        nodes = (gql_body.get("data") or {}).get("organizationGraph", {}).get("nodes") or []
        record(
            "18 relationship map (GraphQL)",
            "PASS" if gql.status_code == 200 and len(nodes) >= 1 else "FAIL",
            f"nodes={len(nodes)}",
        )

        dash = client.get("/api/v1/ict-providers?page=1&page_size=1", headers=h)
        record(
            "20 dashboard providers KPI source",
            "PASS" if dash.json().get("total", 0) >= 1 else "FAIL",
        )

        report = client.get("/api/v1/resilience/reports/dora-assessment", headers=h)
        record("22 generate report", "PASS" if report.status_code == 200 else "FAIL")

        csv = client.get("/api/v1/export/ict-providers.csv", headers=h)
        record(
            "23 export providers CSV",
            "PASS" if csv.status_code == 200 and suffix in csv.text else "FAIL",
        )

        export = client.get("/api/v1/tenant/data/export", headers=h)
        record("24 tenant ZIP export", "PASS" if export.status_code == 200 else "FAIL")

        prov_b = client.post(
            "/api/v1/tenant/provision",
            headers=sa_h,
            json={
                "legal_name": f"Other Bank {suffix}",
                "country_code": "FR",
                "admin_email": f"other-{suffix}@example.com",
                "admin_password": "OtherAdminPass12!",
            },
        )
        if prov_b.status_code != 201:
            record("tenant B provision", "FAIL", prov_b.text[:120])
            token_b = None
        else:
            token_b = prov_b.json()["access_token"]
        h_b = {"Authorization": f"Bearer {token_b}"} if token_b else {}
        for label, url in (
            ("provider", f"/api/v1/ict-providers/{pid}"),
            ("contract", f"/api/v1/contracts/{cid}"),
            ("service", f"/api/v1/ict-services/{sid}"),
        ):
            if not token_b:
                record(f"tenant isolation {label}", "SKIP", "tenant B not provisioned")
                continue
            leak = client.get(url, headers=h_b)
            record(f"tenant isolation {label}", "PASS" if leak.status_code == 404 else "FAIL", str(leak.status_code))

        unauth = client.get("/api/v1/ict-providers")
        record("security unauthenticated", "PASS" if unauth.status_code == 401 else "FAIL")

        # Persistence marker for restart test
        marker_path = ROOT / ".acceptance-marker"
        marker_path.write_text(
            json.dumps(
                {
                    "suffix": suffix,
                    "admin_email": admin_email,
                    "organization_id": org_customer,
                    "admin_password": admin_password,
                }
            ),
            encoding="utf-8",
        )
        record("persistence marker written", "PASS", str(marker_path))

        out = {"results": [{"step": a, "status": b, "detail": c} for a, b, c in RESULTS]}
        artifacts = Path("/opt/cursor/artifacts")
        artifacts.mkdir(parents=True, exist_ok=True)
        (artifacts / "acceptance-validation.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
        failed = sum(1 for _, s, _ in RESULTS if s == "FAIL")
        return 1 if failed else 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
