import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_render_all_demos():
    for cfg in [
        "config/clients/demo-static.yaml",
        "config/clients/demo-react-node.yaml",
        "config/clients/demo-vue-python.yaml",
    ]:
        subprocess.check_call(
            [sys.executable, str(ROOT / "automation/whbp/render.py"), "--config", cfg],
            cwd=ROOT,
            env={**__import__("os").environ, "PYTHONPATH": str(ROOT)},
        )
        name = cfg.split("/")[-1].replace(".yaml", "").replace("demo-", "demo-")
        # generated dir uses client id from file
        gen_root = ROOT / ".generated"
        assert any(gen_root.iterdir()), "expected generated output"


def test_vue_config_has_no_redis_when_disabled():
    subprocess.check_call(
        [sys.executable, str(ROOT / "automation/whbp/render.py"), "--config", "config/clients/demo-static.yaml"],
        cwd=ROOT,
        env={**__import__("os").environ, "PYTHONPATH": str(ROOT)},
    )
    compose = (ROOT / ".generated/demo-static-development/docker-compose.yml").read_text()
    assert "redis:" not in compose


def _render(config: str):
    import yaml

    subprocess.check_call(
        [sys.executable, str(ROOT / "automation/whbp/render.py"), "--config", config],
        cwd=ROOT,
        env={**__import__("os").environ, "PYTHONPATH": str(ROOT)},
    )
    name = config.split("/")[-1].replace(".yaml", "")
    gen = ROOT / ".generated" / f"{name.replace('demo-', 'demo-')}-development/docker-compose.yml"
    # generated dir keyed by client id + env; derive from rendered metadata instead
    meta = list((ROOT / ".generated").glob(f"{name}-*/docker-compose.yml"))
    path = meta[0] if meta else gen
    return yaml.safe_load(path.read_text())


def test_shared_proxy_drops_local_proxy_and_adds_edge():
    doc = _render("config/clients/demo-shared-a.yaml")
    services = doc["services"]
    # No per-client nginx proxy (it would collide on host :80/:443)
    assert "proxy" not in services
    # No service publishes host ports in shared mode
    for svc in services.values():
        assert "ports" not in svc
    # Edge network is declared external and frontend joins it
    assert doc["networks"]["edge"] == {"name": "whbp_edge", "external": True}
    assert set(services["frontend"]["networks"]) == {"default", "edge"}


def test_shared_proxy_traefik_labels():
    doc = _render("config/clients/demo-shared-a.yaml")
    labels = doc["services"]["frontend"]["labels"]
    assert labels["traefik.enable"] == "true"
    assert labels["traefik.docker.network"] == "whbp_edge"
    assert labels["traefik.http.routers.demo-shared-a-development-fe.rule"] == "Host(`a.demo.local`)"
    assert labels["traefik.http.routers.demo-shared-a-development-fe.entrypoints"] == "web"
    assert labels["traefik.http.services.demo-shared-a-development-fe.loadbalancer.server.port"] == "80"


def test_non_shared_still_has_proxy_with_ports():
    doc = _render("config/clients/demo-static.yaml")
    assert "proxy" in doc["services"]
    assert doc["services"]["proxy"]["ports"] == ["80:80", "443:443"]


def test_render_edge_stack():
    from automation.whbp.render_edge import render_edge

    doc = render_edge(dashboard=True)
    traefik = doc["services"]["traefik"]
    assert traefik["ports"][:2] == ["80:80", "443:443"]
    assert doc["networks"]["edge"] == {"name": "whbp_edge", "external": True}
    assert "--providers.docker.exposedbydefault=false" in traefik["command"]


def test_render_edge_acme_requires_email():
    import pytest

    from automation.whbp.render_edge import render_edge

    with pytest.raises(ValueError):
        render_edge(acme=True, acme_email="")

    doc = render_edge(acme=True, acme_email="ops@example.com")
    cmd = doc["services"]["traefik"]["command"]
    assert any("acme.email=ops@example.com" in c for c in cmd)
