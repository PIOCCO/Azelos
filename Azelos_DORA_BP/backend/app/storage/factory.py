"""Resolve EvidenceStorage implementation from environment."""

from __future__ import annotations

import os
from pathlib import Path

from app.storage.base import EvidenceStorage
from app.storage.local import LocalEvidenceStorage


class StorageConfigurationError(ValueError):
    pass


def get_evidence_storage() -> EvidenceStorage:
    provider = (os.getenv("STORAGE_PROVIDER") or "local").strip().lower()
    if provider == "local":
        base = Path(os.getenv("STORAGE_LOCAL_PATH", "./storage"))
        return LocalEvidenceStorage(base)
    if provider == "azure_blob":
        from app.storage.azure_blob import AzureBlobEvidenceStorage

        account = os.getenv("AZURE_STORAGE_ACCOUNT", "").strip()
        container = os.getenv("AZURE_STORAGE_CONTAINER", "").strip()
        if not account or not container:
            raise StorageConfigurationError(
                "AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_CONTAINER are required "
                "when STORAGE_PROVIDER=azure_blob"
            )
        return AzureBlobEvidenceStorage(account, container)
    if provider == "s3":
        from app.storage.s3 import S3EvidenceStorage

        bucket = os.getenv("S3_BUCKET", "").strip()
        if not bucket:
            raise StorageConfigurationError("S3_BUCKET is required when STORAGE_PROVIDER=s3")
        return S3EvidenceStorage(bucket, os.getenv("S3_REGION"))
    if provider == "s3_compatible":
        from app.storage.s3_compatible import S3CompatibleEvidenceStorage

        endpoint = os.getenv("S3_ENDPOINT", "").strip()
        bucket = os.getenv("S3_BUCKET", "").strip()
        if not endpoint or not bucket:
            raise StorageConfigurationError(
                "S3_ENDPOINT and S3_BUCKET are required when STORAGE_PROVIDER=s3_compatible"
            )
        return S3CompatibleEvidenceStorage(endpoint, bucket, os.getenv("S3_REGION"))
    raise StorageConfigurationError(f"Unsupported STORAGE_PROVIDER: {provider}")
