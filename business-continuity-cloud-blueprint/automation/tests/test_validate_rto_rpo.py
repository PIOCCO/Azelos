import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_validate_rpo_flags_payment_api():
    proc = subprocess.run(
        [sys.executable, str(ROOT / "automation/bcdr/validate_rto_rpo.py")],
        cwd=ROOT,
        env={**dict(**{"PYTHONPATH": str(ROOT)}), **dict(__import__("os").environ)},
        capture_output=True,
        text=True,
    )
    data = json.loads(proc.stdout)
    payment = next(r for r in data["results"] if r["service"] == "payment_api")
    assert payment["rpo_status"] == "FAIL"
    assert "RPO TARGET NOT SATISFIED" in payment.get("rpo_reason", "")
    assert proc.returncode == 1


def test_render_tfvars():
    out = ROOT / "tests/output/dev.tfvars"
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            sys.executable,
            str(ROOT / "automation/bcdr/render_tfvars.py"),
            "--client",
            str(ROOT / "client.yaml"),
            "--environment",
            "dev",
            "--output",
            str(out),
        ],
        cwd=ROOT,
        env={**dict(__import__("os").environ), "PYTHONPATH": str(ROOT)},
    )
    assert "profile" in out.read_text()
