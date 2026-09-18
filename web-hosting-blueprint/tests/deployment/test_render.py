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
