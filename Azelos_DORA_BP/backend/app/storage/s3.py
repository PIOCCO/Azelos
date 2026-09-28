"""AWS S3 adapter placeholder — optional boto3 integration in a future task."""

from __future__ import annotations

from app.storage.base import StoredObject


class S3EvidenceStorage:
    def __init__(self, bucket: str, region: str | None = None) -> None:
        self.bucket = bucket
        self.region = region

    def upload(
        self,
        key: str,
        data: bytes,
        *,
        content_type: str | None = None,
    ) -> StoredObject:
        raise NotImplementedError(
            "S3 storage adapter is not bundled; add boto3 and implement."
        )

    def download(self, key: str) -> bytes:
        raise NotImplementedError("S3 storage adapter is not bundled; add boto3 and implement.")

    def delete(self, key: str) -> None:
        raise NotImplementedError("S3 storage adapter is not bundled; add boto3 and implement.")

    def exists(self, key: str) -> bool:
        raise NotImplementedError("S3 storage adapter is not bundled; add boto3 and implement.")
