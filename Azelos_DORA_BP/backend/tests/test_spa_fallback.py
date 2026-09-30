"""SPA refresh: frontend routes must return index.html, API must stay JSON."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def spa_client(tmp_path, monkeypatch):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text(
        '<!doctype html><html><body><div id="root"></div></body></html>',
        encoding="utf-8",
    )
    assets = dist / "assets"
    assets.mkdir()
    (assets / "app.js").write_text("console.log('ok');", encoding="utf-8")

    monkeypatch.setenv("SERVE_FRONTEND", "1")
    monkeypatch.setenv("DISABLE_FRONTEND_STATIC", "0")
    monkeypatch.setattr("app.main._frontend_dist_dir", lambda: dist)

    from app.core.database import get_db
    from app.main import create_app

    app = create_app()

    def _db():
        yield None  # not used by these GETs

    app.dependency_overrides[get_db] = _db
    yield TestClient(app)


def test_spa_route_returns_index_html(spa_client):
    r = spa_client.get("/risks", headers={"Accept": "text/html"})
    assert r.status_code == 200
    assert "root" in r.text
    assert r.headers["content-type"].startswith("text/html")


def test_spa_nested_dora_route(spa_client):
    r = spa_client.get("/dora/relationship-map", headers={"Accept": "text/html"})
    assert r.status_code == 200
    assert "root" in r.text


def test_api_still_json_not_found(spa_client):
    r = spa_client.get("/api/v1/does-not-exist")
    assert r.status_code == 404
    assert r.headers["content-type"].startswith("application/json")


def test_health_not_index_html(spa_client):
    r = spa_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "alive"
