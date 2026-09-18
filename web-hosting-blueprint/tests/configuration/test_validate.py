import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(config: str) -> int:
    proc = subprocess.run(
        [sys.executable, str(ROOT / "automation/whbp/validate.py"), "--config", config],
        cwd=ROOT,
        env={**__import__("os").environ, "PYTHONPATH": str(ROOT)},
    )
    return proc.returncode


def test_demo_static_valid():
    assert run("config/clients/demo-static.yaml") == 0


def test_demo_react_valid():
    assert run("config/clients/demo-react-node.yaml") == 0


def test_demo_vue_valid():
    assert run("config/clients/demo-vue-python.yaml") == 0


def test_invalid_domain_fails(tmp_path):
    bad = tmp_path / "bad.yaml"
    bad.write_text(
        """
client: {name: x, id: x}
application: {name: x, slug: x}
environment: {name: dev, type: development}
hosting: {profile: small}
frontend: {enabled: true, framework: static, port: 80, source: {build_context: frontend/examples/static}}
backend: {enabled: false, framework: none, port: 8000, health_endpoint: /health}
database: {enabled: false, engine: none}
redis: {enabled: false}
domains: {frontend: not a domain!, backend: api.local}
ssl: {enabled: false}
deployment: {strategy: rolling}
"""
    )
    assert run(str(bad)) == 1
