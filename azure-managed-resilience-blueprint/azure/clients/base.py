from __future__ import annotations

import logging

logger = logging.getLogger("atlas.azure")


def get_bearer_token(scope: str = "https://management.azure.com/.default") -> str | None:
    try:
        from azure.identity import DefaultAzureCredential

        cred = DefaultAzureCredential(exclude_interactive_browser_credential=True)
        return cred.get_token(scope).token
    except Exception as exc:  # noqa: BLE001
        logger.warning("azure_credential_unavailable", extra={"error": str(exc)})
        return None
