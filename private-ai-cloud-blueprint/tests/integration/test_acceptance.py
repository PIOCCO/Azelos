"""Acceptance scenario — requires Postgres+pgvector (run via docker compose exec api pytest)."""

import io
import os
import time

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.skipif(os.getenv("RUN_PAIC_INTEGRATION") != "1", reason="Set RUN_PAIC_INTEGRATION=1 with Postgres")


@pytest.fixture(scope="module")
def client():
    os.environ.setdefault("APP_ENV", "test")
    os.environ.setdefault("LLM_MOCK", "true")
    from app.main import app

    with TestClient(app) as c:
        yield c


def _login(client, email, password):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]


def test_full_acceptance_flow(client):
    admin_token = _login(client, "admin@company.local", "admin123!")
    headers = {"Authorization": f"Bearer {admin_token}"}

    hr = client.post("/api/v1/admin/departments", json={"name": "HR"}, headers=headers)
    fin = client.post("/api/v1/admin/departments", json={"name": "Finance"}, headers=headers)
    assert hr.status_code == 200 and fin.status_code == 200
    hr_id = hr.json()["id"]

    hr_user = client.post(
        "/api/v1/admin/users",
        json={"email": "hr@company.local", "password": "hr123!", "full_name": "HR User", "role": "EMPLOYEE", "department_id": hr_id},
        headers=headers,
    )
    fin_dept = fin.json()["id"]
    fin_user = client.post(
        "/api/v1/admin/users",
        json={"email": "fin@company.local", "password": "fin123!", "full_name": "Fin User", "role": "EMPLOYEE", "department_id": fin_dept},
        headers=headers,
    )
    assert hr_user.status_code == 200 and fin_user.status_code == 200

    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    sample = Path("/app/sample-documents/HR_Handbook.txt")
    content = sample.read_bytes() if sample.exists() else (root / "sample-documents/HR_Handbook.txt").read_bytes()
    up = client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={"file": ("HR_Handbook.txt", io.BytesIO(content), "text/plain")},
        data={"department_id": hr_id},
    )
    assert up.status_code == 200
    doc_id = up.json()["document_id"]

    for _ in range(30):
        docs = client.get("/api/v1/documents", headers=headers).json()
        st = next(d["status"] for d in docs if d["id"] == doc_id)
        if st == "INDEXED":
            break
        time.sleep(0.2)
    else:
        pytest.fail("Document not indexed")

    client.put(f"/api/v1/documents/{doc_id}/permissions", json={"department_ids": [hr_id], "user_ids": []}, headers=headers)

    hr_token = _login(client, "hr@company.local", "hr123!")
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    q = client.post("/api/v1/chat/query", json={"message": "What is our vacation policy?"}, headers=hr_headers)
    assert q.status_code == 200
    body = q.json()
    assert "20" in body["answer"] or "vacation" in body["answer"].lower()
    assert body["citations"]

    fin_token = _login(client, "fin@company.local", "fin123!")
    q2 = client.post("/api/v1/chat/query", json={"message": "What is our vacation policy?"}, headers={"Authorization": f"Bearer {fin_token}"})
    assert q2.status_code == 200
    assert not q2.json()["citations"]

    client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
    q3 = client.post("/api/v1/chat/query", json={"message": "What is our vacation policy?"}, headers=hr_headers)
    assert not q3.json()["citations"]

    audit = client.get("/api/v1/audit", headers=headers)
    assert audit.status_code == 200
    actions = {a["action"] for a in audit.json()}
    assert "DOCUMENT_UPLOAD" in actions
    assert "AI_QUERY" in actions
