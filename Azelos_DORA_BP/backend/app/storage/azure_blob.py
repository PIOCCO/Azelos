"""Azure Blob adapter placeholder — optional SDK integration in a future task."""

from __future__ import annotations

from app.storage.base import StoredObject


class AzureBlobEvidenceStorage:
    """Configure via AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_CONTAINER (not hard-coded)."""

    def __init__(self, account: str, container: str) -> None:
        self.account = account
        self.container = container

    def upload(
        self,
        key: str,
        data: bytes,
        *,
        content_type: str | None = None,
    ) -> StoredObject:
        raise NotImplementedError(
            "Azure Blob storage adapter is not bundled; add azure-storage-blob and implement."
        )

    def download(self, key: str) -> bytes:
        raise NotImplementedError(
            "Azure Blob storage adapter is not bundled; add azure-storage-blob and implement."
        )

    def delete(self, key: str) -> None:
        raise NotImplementedError(
            "Azure Blob storage adapter is not bundled; add azure-storage-blob and implement."
        )

    def exists(self, key: str) -> bool:
        raise NotImplementedError(
            "Azure Blob storage adapter is not bundled; add azure-storage-blob and implement."
        )
