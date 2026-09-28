"""Provider-neutral evidence object storage interface."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class StoredObject:
    key: str
    content_type: str | None
    size_bytes: int


class EvidenceStorage(Protocol):
    """Business logic depends on this protocol, not a cloud vendor SDK."""

    def upload(
        self,
        key: str,
        data: bytes,
        *,
        content_type: str | None = None,
    ) -> StoredObject: ...

    def download(self, key: str) -> bytes: ...

    def delete(self, key: str) -> None: ...

    def exists(self, key: str) -> bool: ...
