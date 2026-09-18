def _token(client, email, password):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["access_token"]


def test_customer_financial_summary(client):
    provider = _token(client, "provider@example.com", "Provider123!")
    client.post("/api/v1/sync?tenant_id=tenant-demo", headers={"Authorization": f"Bearer {provider}"})
    customer = _token(client, "customer@example.com", "Customer123!")
    h = {"Authorization": f"Bearer {customer}"}
    data = client.get("/api/v1/customer/financial/summary", headers=h).json()
    assert data["data_available"] is True
    assert data["current_month_usd"] > 0
    assert data["budget_configured"] is True


def test_customer_cannot_access_provider_customers(client):
    customer = _token(client, "customer@example.com", "Customer123!")
    assert client.get("/api/v1/customers", headers={"Authorization": f"Bearer {customer}"}).status_code == 403


def test_customer_b_tenant_isolation_financial(client):
    provider = _token(client, "provider@example.com", "Provider123!")
    client.post("/api/v1/sync?tenant_id=tenant-demo", headers={"Authorization": f"Bearer {provider}"})
    # Customer demo only has tenant-demo — provider API cross-tenant still blocked for customer role on v1
    customer = _token(client, "customer@example.com", "Customer123!")
    h = {"Authorization": f"Bearer {customer}"}
    assert client.get("/api/v1/resources?tenant_id=tenant-b", headers=h).status_code == 403
    # Customer API ignores tenant param — always own tenant
    summary = client.get("/api/v1/customer/financial/summary", headers=h).json()
    assert summary["data_available"]


def test_provider_blocked_from_customer_portal(client):
    provider = _token(client, "provider@example.com", "Provider123!")
    assert (
        client.get("/api/v1/customer/overview", headers={"Authorization": f"Bearer {provider}"}).status_code == 403
    )


def test_customer_viewer_cannot_approve(client):
    provider = _token(client, "provider@example.com", "Provider123!")
    client.post("/api/v1/sync?tenant_id=tenant-demo", headers={"Authorization": f"Bearer {provider}"})
    viewer = _token(client, "viewer@example.com", "Viewer123!")
    h = {"Authorization": f"Bearer {viewer}"}
    recs = client.get("/api/v1/customer/recommendations", headers=h).json()
    if recs.get("opportunities"):
        rec_id = recs["opportunities"][0]["id"]
        assert client.post(f"/api/v1/customer/recommendations/{rec_id}/approve", headers=h).status_code == 403


def test_customer_cannot_access_tenant_b_via_provider_apis(client):
    provider = _token(client, "provider@example.com", "Provider123!")
    client.post("/api/v1/sync?tenant_id=tenant-demo", headers={"Authorization": f"Bearer {provider}"})
    customer = _token(client, "customer@example.com", "Customer123!")
    h = {"Authorization": f"Bearer {customer}"}
    assert client.get("/api/v1/reports/monthly?tenant_id=tenant-b", headers=h).status_code == 403
    assert client.get("/api/v1/recommendations?tenant_id=tenant-b", headers=h).status_code == 403
    assert client.get("/api/v1/audit-logs?tenant_id=tenant-b", headers=h).status_code == 403
    assert client.get("/api/v1/alerts?tenant_id=tenant-b", headers=h).status_code == 403


def test_customer_services_breakdown(client):
    provider = _token(client, "provider@example.com", "Provider123!")
    client.post("/api/v1/sync?tenant_id=tenant-demo", headers={"Authorization": f"Bearer {provider}"})
    customer = _token(client, "customer@example.com", "Customer123!")
    h = {"Authorization": f"Bearer {customer}"}
    svc = client.get("/api/v1/customer/financial/services", headers=h).json()
    assert svc["data_available"]
    assert len(svc["services"]) >= 1
