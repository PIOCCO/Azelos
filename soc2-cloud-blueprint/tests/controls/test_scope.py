import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from automation.soc2.config import controls_in_scope, enabled_criteria, load_yaml


def test_security_always_in_scope():
    client = load_yaml(ROOT / "config/clients/example.yaml")
    assert "security" in enabled_criteria(client)


def test_privacy_excluded_reduces_controls():
    client = load_yaml(ROOT / "config/clients/example.yaml")
    catalog = load_yaml(ROOT / "config/controls.yaml")
    scoped = controls_in_scope(client, catalog)
    assert "P1.1" not in scoped
    assert "CC6.1" in scoped


def test_cannot_disable_security_in_validator():
    import subprocess

    bad = ROOT / "tests/controls/_bad_client.yaml"
    bad.write_text(
        """
client: {name: x, id: x}
environment: {name: d, type: development}
cloud: {primary_provider: azure, primary_region: eastus}
soc2:
  criteria: {security: false, availability: false, processing_integrity: false, confidentiality: false, privacy: false}
scope: {in_scope_systems: [a], out_of_scope: []}
integrations: {business_continuity: {enabled: false}, web_hosting: {enabled: false}}
evidence: {retention_days: 90, storage: {type: local, path: evidence/manifests}}
monitoring: {alert_email: a@b.com, continuous_control_checks: true}
remediation: {auto_ticket: false, severity_threshold: low}
"""
    )
    proc = subprocess.run(
        [sys.executable, str(ROOT / "automation/soc2/validate_config.py"), "--config", str(bad)],
        cwd=ROOT,
        env={**__import__("os").environ, "PYTHONPATH": str(ROOT)},
    )
    assert proc.returncode == 1
    bad.unlink()
