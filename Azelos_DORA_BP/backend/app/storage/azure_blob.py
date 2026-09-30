"""Azure Blob evidence storage using azure-storage-blob when installed."""

from __future__ import annotations

from app.storage.base import StoredObject


class AzureBlobEvidenceStorage:
    def __init__(self, account: str, container: str) -> None:
        self.account = account
        self.container = container
        try:
            from azure.identity import DefaultAzureCredential
            from azure.storage.blob import BlobServiceClient
        except ImportError as exc:
            raise RuntimeError(
                "Install azure-storage-blob and azure-identity for Azure evidence storage"
            ) from exc
        account_url = f"https://{account}.blob.core.windows.net"
        self._client = BlobServiceClient(account_url, credential=DefaultAzureCredential())
        self._container = self._client.get_container_client(container)

    def upload(
        self,
        key: str,
        data: bytes,
        *,
        content_type: str | None = None,
    ) -> StoredObject:
        blob = self._container.get_blob_client(key)
        blob.upload_blob(data, overwrite=True, content_type=content_type)
        return StoredObject(key=key, size_bytes=len(data), content_type=content_type)

    def download(self, key: str) -> bytes:
        blob = self._container.get_blob_client(key)
        return blob.download_blob().readall()

    def exists(self, key: str) -> bool:
        blob = self._container.get_blob_client(key)
        return blob.exists()

    def delete(self, key: str) -> None:
        blob = self._container.get_blob_client(key)
        blob.delete_blob()
