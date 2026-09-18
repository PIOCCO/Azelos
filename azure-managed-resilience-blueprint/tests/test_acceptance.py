def _login(client, email="provider@example.com", password="Provider123!"):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_health(client):
    body = client.get("/api/v1/health").json()
    assert body["status"] == "ok"
    assert "Atlas" in body["product"]


def test_ready(client):
    assert client.get("/api/v1/ready").status_code == 200


def test_discovery_and_backup_gap(client):
    token = _login(client)
    h = {"Authorization": f"Bearer {token}"}
    sync = client.post("/api/v1/sync?tenant_id=tenant-demo", headers=h)
    assert sync.status_code == 200
    backups = client.get("/api/v1/backups?tenant_id=tenant-demo", headers=h).json()
    names = {i["name"]: i["protected"] for i in backups["items"]}
    assert names.get("production-vm-03") is False


def test_resilience_score_in_overview(client):
    token = _login(client)
    h = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/sync?tenant_id=tenant-demo", headers=h)
    overview = client.get("/api/v1/dashboard/overview?tenant_id=tenant-demo", headers=h).json()
    assert "resilience" in overview
    assert overview["resilience"]["score"] >= 0


def test_recommendation_approve_execute_audit(client):
    token = _login(client)
    h = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/sync?tenant_id=tenant-demo", headers=h)
    recs = client.get("/api/v1/recommendations?tenant_id=tenant-demo", headers=h).json()
    assert recs
    rec_id = recs[0]["id"]
    assert client.post(f"/api/v1/recommendations/{rec_id}/approve", headers=h).status_code == 200
    assert client.post(f"/api/v1/recommendations/{rec_id}/execute", headers=h).status_code == 200
    logs = client.get("/api/v1/audit-logs?tenant_id=tenant-demo", headers=h).json()
    actions = {l["action"] for l in logs}
    assert "RECOMMENDATION_APPROVED" in actions
    assert "ACTION_EXECUTED" in actions


def test_tenant_isolation_resources(client):
    token = _login(client, "customer@example.com", "Customer123!")
    h = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/v1/resources?tenant_id=tenant-b", headers=h).status_code == 403


def test_tenant_isolation_recommendation_execute(client):
    token = _login(client)
    h = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/sync?tenant_id=tenant-demo", headers=h)
    recs = client.get("/api/v1/recommendations?tenant_id=tenant-demo", headers=h).json()
    rec_id = recs[0]["id"]
    customer = _login(client, "customer@example.com", "Customer123!")
    ch = {"Authorization": f"Bearer {customer}"}
    assert client.post(f"/api/v1/recommendations/{rec_id}/execute", headers=ch).status_code in (400, 403)


def test_viewer_cannot_sync(client):
    token = _login(client, "viewer@example.com", "Viewer123!")
    h = {"Authorization": f"Bearer {token}"}
    assert client.post("/api/v1/sync?tenant_id=tenant-demo", headers=h).status_code == 403


def test_sync_idempotency_sequential(client):
    token = _login(client)
    h = {"Authorization": f"Bearer {token}"}
    assert client.post("/api/v1/sync?tenant_id=tenant-demo", headers=h).status_code == 200
    assert client.post("/api/v1/sync?tenant_id=tenant-demo", headers=h).status_code == 200
    history = client.get("/api/v1/sync/history?tenant_id=tenant-demo", headers=h).json()
    assert len(history) >= 2
