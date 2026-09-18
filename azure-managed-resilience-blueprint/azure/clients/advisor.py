from __future__ import annotations

import httpx

from azure.clients.base import get_bearer_token, logger


def fetch_cost_recommendations(subscription_id: str) -> tuple[list[dict], list[str]]:
    errors: list[str] = []
    token = get_bearer_token()
    if not token:
        return [], ["Azure credential unavailable for Advisor"]
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}/providers/"
        f"Microsoft.Advisor/recommendations?api-version=2023-01-01&$filter=Category eq 'Cost'"
    )
    items: list[dict] = []
    try:
        with httpx.Client(timeout=45.0) as client:
            resp = client.get(url, headers={"Authorization": f"Bearer {token}"})
            if resp.status_code >= 400:
                errors.append(f"Advisor API returned {resp.status_code}")
                return items, errors
            for rec in resp.json().get("value", [])[:25]:
                props = rec.get("properties", {})
                items.append(
                    {
                        "title": props.get("shortDescription", {}).get("problem", "Cost recommendation"),
                        "evidence": props.get("impact", "Unknown impact"),
                        "severity": "medium",
                    }
                )
    except Exception as exc:  # noqa: BLE001
        logger.warning("advisor_fetch_failed", extra={"error": str(exc)})
        errors.append(str(exc))
    return items, errors
