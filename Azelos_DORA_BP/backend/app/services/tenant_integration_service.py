"""Tenant integration CRUD and connection testing."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
import psycopg
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import AuditAction
from app.models.enums_config import ConfigAuditAction
from app.models.enums_integrations import IntegrationStatus, IntegrationType
from app.models.tenant_integration import TenantIntegration
from app.services.config_audit import log_config_change
from app.services.integration_secrets import decrypt_secrets, encrypt_secrets
from app.services.platform_audit import record_platform_audit


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _enum_val(val: object) -> str:
    return val.value if hasattr(val, "value") else str(val)


class TenantIntegrationService:
    def __init__(self, db: Session, organization_id: uuid.UUID, actor_id: str):
        self.db = db
        self.organization_id = organization_id
        self.actor_id = actor_id

    def list_integrations(self) -> list[TenantIntegration]:
        return list(
            self.db.scalars(
                select(TenantIntegration)
                .where(TenantIntegration.financial_entity_id == self.organization_id)
                .order_by(TenantIntegration.integration_type, TenantIntegration.name)
            ).all()
        )

    def get_for_org(self, integration_id: uuid.UUID) -> TenantIntegration | None:
        row = self.db.get(TenantIntegration, integration_id)
        if row is None or row.financial_entity_id != self.organization_id:
            return None
        return row

    def upsert_postgresql(
        self,
        *,
        name: str,
        host: str,
        port: int,
        database: str,
        username: str,
        password: str | None,
        ssl_mode: str,
        integration_id: uuid.UUID | None = None,
    ) -> TenantIntegration:
        config = {
            "host": host.strip(),
            "port": port,
            "database": database.strip(),
            "username": username.strip(),
            "ssl_mode": ssl_mode.strip() or "prefer",
        }
        secrets: dict[str, Any] = {}
        if password:
            secrets["password"] = password

        if integration_id:
            row = self.get_for_org(integration_id)
            if row is None:
                raise LookupError("not_found")
            if _enum_val(row.integration_type) != IntegrationType.POSTGRESQL.value:
                raise ValueError("wrong_type")
            old = {"config": dict(row.config), "status": _enum_val(row.status)}
            row.config = config
            row.name = name.strip()
            if secrets:
                existing = decrypt_secrets(row.secrets_encrypted) if row.secrets_encrypted else {}
                existing.update(secrets)
                row.secrets_encrypted = encrypt_secrets(existing)
            row.status = IntegrationStatus.NOT_CONFIGURED.value
            action = ConfigAuditAction.INTEGRATION_MODIFIED
        else:
            if not secrets.get("password"):
                raise ValueError("password_required")
            row = TenantIntegration(
                financial_entity_id=self.organization_id,
                integration_type=IntegrationType.POSTGRESQL.value,
                name=name.strip(),
                status=IntegrationStatus.NOT_CONFIGURED.value,
                config=config,
                secrets_encrypted=encrypt_secrets(secrets),
            )
            self.db.add(row)
            old = None
            action = ConfigAuditAction.INTEGRATION_CREATED

        self.db.flush()
        log_config_change(
            self.db,
            financial_entity_id=self.organization_id,
            actor_id=self.actor_id,
            action=action,
            object_type="tenant_integration",
            object_id=row.id,
            old_value=old,
            new_value={"integration_type": _enum_val(row.integration_type), "name": row.name, "config": config},
        )
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=self.actor_id,
            entity_type="tenant_integration",
            entity_id=row.id,
            action=AuditAction.UPDATE if integration_id else AuditAction.CREATE,
            new_value={"type": "postgresql", "name": row.name},
        )
        return row

    def upsert_http_api(
        self,
        *,
        name: str,
        base_url: str,
        auth_type: str,
        api_key: str | None,
        integration_id: uuid.UUID | None = None,
    ) -> TenantIntegration:
        config = {
            "base_url": base_url.rstrip("/"),
            "auth_type": auth_type,
        }
        secrets: dict[str, Any] = {}
        if api_key:
            secrets["api_key"] = api_key

        if integration_id:
            row = self.get_for_org(integration_id)
            if row is None:
                raise LookupError("not_found")
            if _enum_val(row.integration_type) != IntegrationType.HTTP_API.value:
                raise ValueError("wrong_type")
            old = {"config": dict(row.config), "status": _enum_val(row.status)}
            row.config = config
            row.name = name.strip()
            if secrets:
                existing = decrypt_secrets(row.secrets_encrypted) if row.secrets_encrypted else {}
                existing.update(secrets)
                row.secrets_encrypted = encrypt_secrets(existing)
            row.status = IntegrationStatus.NOT_CONFIGURED.value
            action = ConfigAuditAction.INTEGRATION_MODIFIED
        else:
            row = TenantIntegration(
                financial_entity_id=self.organization_id,
                integration_type=IntegrationType.HTTP_API.value,
                name=name.strip(),
                status=IntegrationStatus.NOT_CONFIGURED.value,
                config=config,
                secrets_encrypted=encrypt_secrets(secrets) if secrets else None,
            )
            self.db.add(row)
            old = None
            action = ConfigAuditAction.INTEGRATION_CREATED

        self.db.flush()
        log_config_change(
            self.db,
            financial_entity_id=self.organization_id,
            actor_id=self.actor_id,
            action=action,
            object_type="tenant_integration",
            object_id=row.id,
            old_value=old,
            new_value={"integration_type": _enum_val(row.integration_type), "name": row.name, "config": config},
        )
        return row

    def disable(self, integration_id: uuid.UUID) -> TenantIntegration:
        row = self.get_for_org(integration_id)
        if row is None:
            raise LookupError("not_found")
        row.status = IntegrationStatus.DISABLED.value
        row.disabled_at = _utcnow()
        self.db.flush()
        log_config_change(
            self.db,
            financial_entity_id=self.organization_id,
            actor_id=self.actor_id,
            action=ConfigAuditAction.INTEGRATION_DISABLED,
            object_type="tenant_integration",
            object_id=row.id,
        )
        return row

    def test_connection(self, integration_id: uuid.UUID) -> tuple[bool, str]:
        row = self.get_for_org(integration_id)
        if row is None:
            raise LookupError("not_found")
        if _enum_val(row.status) == IntegrationStatus.DISABLED.value:
            return False, "Integration is disabled."

        row.status = IntegrationStatus.CONNECTING.value
        self.db.flush()

        try:
            if _enum_val(row.integration_type) == IntegrationType.POSTGRESQL.value:
                ok, msg = self._test_postgresql(row)
            elif _enum_val(row.integration_type) == IntegrationType.HTTP_API.value:
                ok, msg = self._test_http_api(row)
            else:
                ok, msg = False, "Unsupported integration type."
        except Exception:
            ok, msg = False, "Connection test failed. Check settings and network accessibility."

        row.last_test_at = _utcnow()
        row.last_test_success = ok
        row.last_test_message = msg
        row.status = (
            IntegrationStatus.CONNECTED.value if ok else IntegrationStatus.CONNECTION_FAILED.value
        )
        self.db.flush()

        log_config_change(
            self.db,
            financial_entity_id=self.organization_id,
            actor_id=self.actor_id,
            action=ConfigAuditAction.INTEGRATION_TESTED,
            object_type="tenant_integration",
            object_id=row.id,
            new_value={"success": ok},
        )
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=self.actor_id,
            entity_type="tenant_integration",
            entity_id=row.id,
            action=AuditAction.UPDATE,
            new_value={"connection_test": ok},
        )
        return ok, msg

    def _test_postgresql(self, row: TenantIntegration) -> tuple[bool, str]:
        if not row.secrets_encrypted:
            return False, "Credentials are not configured."
        secrets = decrypt_secrets(row.secrets_encrypted)
        password = secrets.get("password") or ""
        cfg = row.config
        conninfo = (
            f"host={cfg['host']} port={cfg['port']} dbname={cfg['database']} "
            f"user={cfg['username']} password={password} sslmode={cfg.get('ssl_mode', 'prefer')}"
        )
        try:
            with psycopg.connect(conninfo, connect_timeout=10) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
        except psycopg.Error:
            return (
                False,
                "Unable to connect to the configured PostgreSQL service. "
                "Check connection settings and network accessibility.",
            )
        return True, "PostgreSQL is reachable and authentication succeeded."

    def _test_http_api(self, row: TenantIntegration) -> tuple[bool, str]:
        base_url = row.config.get("base_url", "")
        if not base_url:
            return False, "Base URL is required."
        headers: dict[str, str] = {}
        if row.secrets_encrypted:
            secrets = decrypt_secrets(row.secrets_encrypted)
            key = secrets.get("api_key")
            if key:
                auth_type = row.config.get("auth_type", "bearer")
                if auth_type == "bearer":
                    headers["Authorization"] = f"Bearer {key}"
                elif auth_type == "api_key_header":
                    headers["X-API-Key"] = key
        try:
            with httpx.Client(timeout=15.0) as client:
                r = client.get(base_url, headers=headers)
                if r.status_code >= 500:
                    return False, "External system returned a server error."
        except httpx.HTTPError:
            return (
                False,
                "Unable to reach the configured external API. Check the endpoint and network accessibility.",
            )
        return True, "External API endpoint is reachable."
