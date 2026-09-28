"""Local filesystem storage for development and tests."""

from __future__ import annotations

from pathlib import Path

from app.storage.base import StoredObject


class LocalEvidenceStorage:
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path.resolve()

    def _path(self, key: str) -> Path:
        safe = key.lstrip("/").replace("..", "")
        return self.base_path / safe

    def upload(
        self,
        key: str,
        data: bytes,
        *,
        content_type: str | None = None,
    ) -> StoredObject:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return StoredObject(key=key, content_type=content_type, size_bytes=len(data))

    def download(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            path.unlink()

    def exists(self, key: str) -> bool:
        return self._path(key).is_file()
