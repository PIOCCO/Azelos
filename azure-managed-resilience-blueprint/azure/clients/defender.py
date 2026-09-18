from __future__ import annotations

import httpx

from azure.clients.base import get_bearer_token, logger


def fetch_secure_scores(subscription_id: str) -> tuple[dict[str, int], list[str]]:
    """Aggregate Defender secure score controls when API is available."""
    errors: list[str] = []
    token = get_bearer_token()
    if not token:
        return {}, ["Azure credential unavailable for Defender"]
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}/providers/"
        f"Microsoft.Security/secureScores?api-version=2020-01-01"
    )
    counts: dict[str, int] = {}
    try:
        with httpx.Client(timeout=45.0) as client:
            resp = client.get(url, headers={"Authorization": f"Bearer {token}"})
            if resp.status_code >= 400:
                errors.append(f"Defender API returned {resp.status_code}")
                return counts, errors
            for item in resp.json().get("value", []):
                score = item.get("properties", {}).get("current", {})
                unhealthy = int(score.get("unhealthyResourceCount", 0) or 0)
                if unhealthy:
                    counts["medium"] = counts.get("medium", 0) + unhealthy
    except Exception as exc:  # noqa: BLE001
        logger.warning("defender_fetch_failed", extra={"error": str(exc)})
        errors.append(str(exc))
    return counts, errors
