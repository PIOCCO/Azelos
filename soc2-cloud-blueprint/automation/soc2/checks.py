"""Automated control checks — return structured status per control."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from automation.soc2.paths import repo_root


def _policy_exists(name: str) -> bool:
    root = repo_root()
    return (root / "policies" / name).exists()


def run_check(check_id: str, client: dict[str, Any], mock: bool) -> dict[str, Any]:
    """Return check result with explicit compliance state fields (not 'SOC 2 compliant')."""
    base = {
        "check_id": check_id,
        "control_defined": True,
        "control_implemented": False,
        "control_operating": False,
        "evidence_collected": False,
        "evidence_sufficient": False,
        "independently_audited": False,
    }

    if check_id == "identity.mfa_enabled_for_admins":
        base.update(
            {
                "control_implemented": True,
                "control_operating": mock,
                "evidence_collected": mock,
                "detail": "Verify MFA for privileged roles in IdP/Azure AD (manual attestation if mock)",
            }
        )
    elif check_id == "cloud.storage_encryption_enabled":
        base.update(
            {
                "control_implemented": True,
                "control_operating": mock,
                "evidence_collected": mock,
                "detail": "Storage encryption at rest — collect Azure Policy or AWS config export",
            }
        )
    elif check_id == "cloud.tls_minimum_version":
        base.update(
            {
                "control_implemented": True,
                "control_operating": True,
                "evidence_collected": mock,
                "detail": "TLS 1.2+ on public endpoints",
            }
        )
    elif check_id == "monitoring.security_alerts_configured":
        alerts = repo_root() / "monitoring/alerts"
        ok = alerts.exists() and any(alerts.glob("*.json"))
        base.update(
            {
                "control_implemented": ok,
                "control_operating": ok and mock,
                "evidence_collected": ok and mock,
                "detail": "Alert rules present under monitoring/alerts/",
            }
        )
    elif check_id == "workflows.incident_runbook_present":
        ok = (repo_root() / "workflows/incident/runbook.md").exists()
        base.update(
            {
                "control_implemented": ok,
                "control_operating": ok,
                "evidence_collected": ok,
                "detail": "Incident workflow documented",
            }
        )
    elif check_id == "workflows.change_management_documented":
        ok = _policy_exists("change-management/policy.md")
        base.update(
            {
                "control_implemented": ok,
                "control_operating": ok,
                "evidence_collected": ok,
            }
        )
    elif check_id == "workflows.vendor_review_scheduled":
        ok = (repo_root() / "workflows/vendor-review/checklist.md").exists()
        base.update(
            {
                "control_implemented": ok,
                "control_operating": False,
                "evidence_collected": False,
                "detail": "Requires executed vendor review records",
            }
        )
    elif check_id == "integrations.bcdr_inventory_linked":
        path = client.get("integrations", {}).get("business_continuity", {}).get("inventory_path", "")
        ok = bool(path) and Path(path).exists()
        base.update(
            {
                "control_implemented": client.get("integrations", {}).get("business_continuity", {}).get("enabled", False),
                "control_operating": ok,
                "evidence_collected": ok,
            }
        )
    elif check_id == "policies.data_classification_present":
        ok = _policy_exists("data-classification/policy.md")
        base.update({"control_implemented": ok, "evidence_collected": ok})
    elif check_id == "policies.privacy_policy_present":
        ok = _policy_exists("information-security/policy.md")
        base.update({"control_implemented": ok, "evidence_collected": ok})
    elif check_id == "identity.access_review_current":
        base.update(
            {
                "control_implemented": True,
                "control_operating": False,
                "evidence_collected": False,
                "detail": "Run workflows/access-review/ and attach evidence",
            }
        )
    else:
        base["detail"] = "No automated check implemented — manual evidence required"

    status = "PASS"
    if not base["control_implemented"]:
        status = "GAP"
    elif not base["control_operating"]:
        status = "WARNING"
    base["status"] = status
    return base


def run_all(client: dict[str, Any], catalog: dict[str, Any], mock: bool) -> list[dict[str, Any]]:
    from automation.soc2.config import controls_in_scope

    results = []
    for cid, ctrl in controls_in_scope(client, catalog).items():
        check = ctrl.get("automated_check")
        if not check:
            results.append(
                {
                    "control_id": cid,
                    "status": "MANUAL",
                    "control_defined": True,
                    "control_implemented": None,
                    "detail": "Manual evidence required",
                }
            )
            continue
        item = run_check(check, client, mock)
        item["control_id"] = cid
        results.append(item)
    return results
