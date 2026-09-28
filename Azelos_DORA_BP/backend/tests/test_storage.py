"""Evidence storage abstraction (local adapter; cloud adapters stay optional)."""

from __future__ import annotations

import importlib
from pathlib import Path

import pytest

from app.storage.factory import StorageConfigurationError, get_evidence_storage
from app.storage.local import LocalEvidenceStorage


def test_local_storage_upload_download_delete(tmp_path: Path):
    storage = LocalEvidenceStorage(tmp_path)
    key = "evidence/2026/contract-123.pdf"
    payload = b"%PDF-1.4 test"
    stored = storage.upload(key, payload, content_type="application/pdf")
    assert stored.size_bytes == len(payload)
    assert storage.exists(key)
    assert storage.download(key) == payload
    storage.delete(key)
    assert not storage.exists(key)


def test_get_evidence_storage_local(tmp_path, monkeypatch):
    monkeypatch.setenv("STORAGE_PROVIDER", "local")
    monkeypatch.setenv("STORAGE_LOCAL_PATH", str(tmp_path))
    storage = get_evidence_storage()
    assert isinstance(storage, LocalEvidenceStorage)


def test_azure_storage_not_required_in_business_models():
    risk = importlib.import_module("app.models.risk")
    contract = importlib.import_module("app.models.contract")
    for mod in (risk, contract):
        source = Path(mod.__file__).read_text(encoding="utf-8")
        assert "azure" not in source.lower()
        assert "boto3" not in source.lower()


def test_evidence_metadata_fields_provider_neutral(db_session):
    from sqlalchemy import select

    from app.models import DocumentType, Evidence, FinancialEntity, ICTProvider
    from app.models.enums import ProviderStatus, ProviderType, VerificationStatus

    fe = FinancialEntity(legal_name="Storage Bank", country_code="DE")
    db_session.add(fe)
    db_session.flush()
    provider = ICTProvider(
        financial_entity_id=fe.id,
        legal_name="P",
        lei="529900T8BM49AURSDO55",
        country_code="DE",
        provider_type=ProviderType.OTHER,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(provider)
    db_session.flush()
    doc_type = db_session.scalar(select(DocumentType).limit(1))
    ev = Evidence(
        financial_entity_id=fe.id,
        provider_id=provider.id,
        document_type_id=doc_type.id,
        storage_provider="s3",
        storage_object_key="evidence/2026/x.pdf",
        file_name="x.pdf",
        content_hash="c" * 64,
        content_type="application/pdf",
        uploaded_by="u@b",
        verification_status=VerificationStatus.UNVERIFIED,
    )
    db_session.add(ev)
    db_session.flush()
    assert ev.storage_provider == "s3"
    assert "windows.net" not in (ev.storage_object_key or "")


def test_azure_blob_factory_requires_config(monkeypatch):
    monkeypatch.setenv("STORAGE_PROVIDER", "azure_blob")
    monkeypatch.delenv("AZURE_STORAGE_ACCOUNT", raising=False)
    with pytest.raises(StorageConfigurationError):
        get_evidence_storage()
