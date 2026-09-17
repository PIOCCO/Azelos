import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_collect_evidence_mock():
    subprocess.check_call(
        [sys.executable, str(ROOT / "automation/soc2/collect_evidence.py"), "--config", "config/clients/example.yaml"],
        cwd=ROOT,
        env={**__import__("os").environ, "PYTHONPATH": str(ROOT), "SOC2BP_MOCK_MODE": "true"},
    )
    manifests = list((ROOT / "evidence/manifests").glob("example-saas-*"))
    assert manifests
    assert (manifests[-1] / "manifest.json").exists()
