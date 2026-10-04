from __future__ import annotations

import hashlib
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.licensing.crypto import (
    canonical_payload_bytes,
    canonical_revocation_list_bytes,
    default_public_key_path,
    load_public_key,
    load_public_key_from_file,
    verify_signature,
)
from app.licensing.enums import LicenseAccessMode, LicensePlan, LicenseStatus
from app.licensing.loader import load_license_envelope_from_env, load_revocation_envelope_from_env
from app.licensing.schema import (
    LICENSE_FORMAT_VERSION,
    LicenseEnvelope,
    LicensePayload,
    RevocationListEnvelope,
)
from app.models.auth import OrganizationMembership
from app.models.enums import AuditAction
from app.models.licensing import OrganizationLicense
from app.services.platform_audit import record_platform_audit

log = logging.getLogger("app.licensing")

EXPIRY_WARNING_DAYS = (30, 14, 7, 1)


@dataclass
class LicenseEvaluation:
    organization_id: UUID | None
    license_id: UUID | None
    access_mode: LicenseAccessMode
    effective_status: LicenseStatus | None
    plan: LicensePlan | None
    customer_name: str | None
    starts_at: datetime | None
    expires_at: datetime | None
    days_remaining: int | None
    max_users: int | None
    enabled_modules: list[str] | None
    warnings: list[str] = field(default_factory=list)
    message: str | None = None
    validation_ok: bool = False


class LicenseValidationError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


class LicenseService:
    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def enforcement_enabled() -> bool:
        flag = os.getenv("ADORA_LICENSE_ENFORCEMENT", "").strip().lower()
        if flag in ("1", "true", "yes", "on"):
            return True
        if flag in ("0", "false", "no", "off"):
            return False
        return get_settings().app_env.lower() == "production"

    @staticmethod
    @lru_cache(maxsize=1)
    def _public_key_pem_cached() -> bytes:
        override = os.getenv("ADORA_LICENSE_PUBLIC_KEY_PEM", "").strip()
        if override:
            return override.encode("utf-8")
        path = os.getenv("ADORA_LICENSE_PUBLIC_KEY_FILE", "").strip()
        if path:
            return Path(os.path.expanduser(path)).read_bytes()
        default_path = default_public_key_path()
        if default_path.is_file():
            return default_path.read_bytes()
        raise LicenseValidationError("LICENSE_CONFIG", "No license public key configured")

    def get_public_key(self):
        return load_public_key(self._public_key_pem_cached())

    def _revoked_license_ids(self) -> set[str]:
        env = load_revocation_envelope_from_env()
        if env is None:
            return set()
        try:
            rev_dicts = [r.model_dump(mode="json") for r in env.revocations]
            message = canonical_revocation_list_bytes(rev_dicts, env.format_version)
            verify_signature(self.get_public_key(), message, env.signature)
        except Exception as exc:
            log.warning("Revocation list invalid: %s", exc.__class__.__name__)
            return set()
        return {str(r.license_id) for r in env.revocations}

    def verify_envelope(self, envelope: LicenseEnvelope) -> LicensePayload:
        if envelope.format_version != LICENSE_FORMAT_VERSION:
            raise LicenseValidationError("LICENSE_FORMAT", "Unsupported license envelope version")
        payload = envelope.payload
        if payload.license_format_version != LICENSE_FORMAT_VERSION:
            raise LicenseValidationError("LICENSE_FORMAT", "Unsupported license payload version")
        message = canonical_payload_bytes(payload)
        try:
            verify_signature(self.get_public_key(), message, envelope.signature)
        except ValueError as exc:
            raise LicenseValidationError("LICENSE_SIGNATURE", str(exc)) from exc
        return payload

    @staticmethod
    def payload_hash(payload: LicensePayload) -> str:
        return hashlib.sha256(canonical_payload_bytes(payload)).hexdigest()

    def evaluate_payload(
        self, payload: LicensePayload, *, organization_id: UUID | None = None
    ) -> LicenseEvaluation:
        org_id = organization_id or payload.organization_id
        if org_id != payload.organization_id:
            raise LicenseValidationError(
                "LICENSE_ORG_MISMATCH", "License organization_id does not match tenant"
            )
        now = datetime.now(timezone.utc)
        revoked_ids = self._revoked_license_ids()
        lid = str(payload.license_id)

        if lid in revoked_ids or payload.license_status == LicenseStatus.REVOKED:
            return LicenseEvaluation(
                organization_id=org_id,
                license_id=payload.license_id,
                access_mode=LicenseAccessMode.READ_ONLY,
                effective_status=LicenseStatus.REVOKED,
                plan=payload.plan,
                customer_name=payload.customer_name,
                starts_at=payload.starts_at,
                expires_at=payload.expires_at,
                days_remaining=_days_remaining(now, payload.expires_at),
                max_users=payload.max_users,
                enabled_modules=payload.enabled_modules,
                message="License revoked — ADORA is in read-only mode.",
                validation_ok=True,
            )

        if payload.license_status == LicenseStatus.SUSPENDED:
            return LicenseEvaluation(
                organization_id=org_id,
                license_id=payload.license_id,
                access_mode=LicenseAccessMode.READ_ONLY,
                effective_status=LicenseStatus.SUSPENDED,
                plan=payload.plan,
                customer_name=payload.customer_name,
                starts_at=payload.starts_at,
                expires_at=payload.expires_at,
                days_remaining=_days_remaining(now, payload.expires_at),
                max_users=payload.max_users,
                enabled_modules=payload.enabled_modules,
                message="License suspended — ADORA is in read-only mode.",
                validation_ok=True,
            )

        if now < payload.starts_at:
            return LicenseEvaluation(
                organization_id=org_id,
                license_id=payload.license_id,
                access_mode=LicenseAccessMode.NOT_STARTED,
                effective_status=LicenseStatus.ACTIVE,
                plan=payload.plan,
                customer_name=payload.customer_name,
                starts_at=payload.starts_at,
                expires_at=payload.expires_at,
                days_remaining=_days_remaining(now, payload.expires_at),
                max_users=payload.max_users,
                enabled_modules=payload.enabled_modules,
                message="License period has not started yet.",
                validation_ok=True,
            )

        if now > payload.expires_at:
            return LicenseEvaluation(
                organization_id=org_id,
                license_id=payload.license_id,
                access_mode=LicenseAccessMode.READ_ONLY,
                effective_status=LicenseStatus.EXPIRED,
                plan=payload.plan,
                customer_name=payload.customer_name,
                starts_at=payload.starts_at,
                expires_at=payload.expires_at,
                days_remaining=0,
                max_users=payload.max_users,
                enabled_modules=payload.enabled_modules,
                message="License expired — ADORA is currently in read-only mode.",
                validation_ok=True,
            )

        days_left = _days_remaining(now, payload.expires_at)
        warnings: list[str] = []
        effective = LicenseStatus.ACTIVE
        for d in EXPIRY_WARNING_DAYS:
            if days_left is not None and days_left <= d:
                warnings.append(f"Your ADORA license expires in {days_left} day(s).")
                effective = LicenseStatus.EXPIRING
                break

        return LicenseEvaluation(
            organization_id=org_id,
            license_id=payload.license_id,
            access_mode=LicenseAccessMode.FULL,
            effective_status=effective,
            plan=payload.plan,
            customer_name=payload.customer_name,
            starts_at=payload.starts_at,
            expires_at=payload.expires_at,
            days_remaining=days_left,
            max_users=payload.max_users,
            enabled_modules=payload.enabled_modules,
            warnings=warnings,
            validation_ok=True,
        )

    def get_installed_row(self, organization_id: UUID) -> OrganizationLicense | None:
        return self.db.scalar(
            select(OrganizationLicense).where(
                OrganizationLicense.financial_entity_id == organization_id
            )
        )

    def evaluate_for_organization(self, organization_id: UUID) -> LicenseEvaluation:
        if not self.enforcement_enabled():
            return LicenseEvaluation(
                organization_id=organization_id,
                license_id=None,
                access_mode=LicenseAccessMode.FULL,
                effective_status=None,
                plan=LicensePlan.INTERNAL,
                customer_name=None,
                starts_at=None,
                expires_at=None,
                days_remaining=None,
                max_users=None,
                enabled_modules=None,
                message="License enforcement disabled (development).",
                validation_ok=True,
            )

        row = self.get_installed_row(organization_id)
        if row is None:
            return LicenseEvaluation(
                organization_id=organization_id,
                license_id=None,
                access_mode=LicenseAccessMode.UNLICENSED,
                effective_status=None,
                plan=None,
                customer_name=None,
                starts_at=None,
                expires_at=None,
                days_remaining=None,
                max_users=None,
                enabled_modules=None,
                message="No valid ADORA license installed for this organization.",
                validation_ok=False,
            )

        try:
            envelope = LicenseEnvelope.model_validate(row.envelope_json)
            payload = self.verify_envelope(envelope)
            if payload.organization_id != organization_id:
                raise LicenseValidationError("LICENSE_ORG_MISMATCH", "Wrong organization")
            current_hash = self.payload_hash(payload)
            if current_hash != row.payload_hash:
                raise LicenseValidationError("LICENSE_TAMPERED", "License payload modified")
            evaluation = self.evaluate_payload(payload, organization_id=organization_id)
            row.last_validated_at = datetime.now(timezone.utc)
            self.db.flush()
            return evaluation
        except LicenseValidationError as exc:
            self._audit_validation_failure(organization_id, exc.code, exc.message)
            return LicenseEvaluation(
                organization_id=organization_id,
                license_id=UUID(row.license_id) if row.license_id else None,
                access_mode=LicenseAccessMode.UNLICENSED,
                effective_status=None,
                plan=row.plan,
                customer_name=row.customer_name,
                starts_at=row.starts_at,
                expires_at=row.expires_at,
                days_remaining=None,
                max_users=row.max_users,
                enabled_modules=row.enabled_modules,
                message=exc.message,
                validation_ok=False,
            )

    def install_envelope(
        self,
        envelope: LicenseEnvelope,
        *,
        organization_id: UUID,
        installed_by: str | None,
        event: str = "installed",
    ) -> LicenseEvaluation:
        payload = self.verify_envelope(envelope)
        if payload.organization_id != organization_id:
            raise LicenseValidationError(
                "LICENSE_ORG_MISMATCH", "License is issued for a different organization"
            )
        evaluation = self.evaluate_payload(payload, organization_id=organization_id)
        phash = self.payload_hash(payload)
        existing = self.get_installed_row(organization_id)
        row = existing or OrganizationLicense(financial_entity_id=organization_id)
        row.license_id = str(payload.license_id)
        row.customer_name = payload.customer_name
        row.plan = payload.plan
        row.license_status = payload.license_status
        row.issued_at = _ensure_utc(payload.issued_at)
        row.starts_at = _ensure_utc(payload.starts_at)
        row.expires_at = _ensure_utc(payload.expires_at)
        row.max_users = payload.max_users
        row.enabled_modules = payload.enabled_modules
        row.product_version = payload.product_version
        row.envelope_json = envelope.model_dump(mode="json")
        row.payload_hash = phash
        row.installed_by = installed_by
        row.last_validated_at = datetime.now(timezone.utc)
        if existing is None:
            self.db.add(row)
        self.db.flush()

        action = AuditAction.UPDATE if existing else AuditAction.CREATE
        notes = f"license_{event}"
        record_platform_audit(
            self.db,
            organization_id=organization_id,
            actor=installed_by or "system",
            entity_type="SoftwareLicense",
            entity_id=row.id,
            action=action,
            new_value={
                "license_id": row.license_id,
                "plan": row.plan.value,
                "expires_at": row.expires_at.isoformat(),
                "event": event,
            },
        )
        return evaluation

    def bootstrap_from_environment(self) -> int:
        """Install license from ADORA_LICENSE* env if present. Returns count installed."""
        envelope = load_license_envelope_from_env()
        if envelope is None:
            return 0
        payload = self.verify_envelope(envelope)
        self.install_envelope(
            envelope,
            organization_id=payload.organization_id,
            installed_by="environment",
            event="activated",
        )
        self.db.commit()
        return 1

    def count_active_memberships(self, organization_id: UUID) -> int:
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(OrganizationMembership)
                .where(OrganizationMembership.financial_entity_id == organization_id)
            )
            or 0
        )

    def can_invite_user(self, organization_id: UUID) -> tuple[bool, str | None]:
        evaluation = self.evaluate_for_organization(organization_id)
        if evaluation.access_mode != LicenseAccessMode.FULL:
            return False, evaluation.message or "License does not allow user invitations"
        if evaluation.max_users is None:
            return True, None
        pending = self.db.scalar(
            select(func.count())
            .select_from(OrganizationMembership)
            .where(OrganizationMembership.financial_entity_id == organization_id)
        )
        # Count pending invitations as consuming capacity
        from app.models.saas import UserInvitation

        invites = self.db.scalar(
            select(func.count())
            .select_from(UserInvitation)
            .where(
                UserInvitation.financial_entity_id == organization_id,
                UserInvitation.accepted_at.is_(None),
            )
        )
        total = int(pending or 0) + int(invites or 0)
        if total >= evaluation.max_users:
            return False, f"Maximum licensed users ({evaluation.max_users}) reached"
        return True, None

    def module_enabled(self, organization_id: UUID, module_key: str) -> bool:
        evaluation = self.evaluate_for_organization(organization_id)
        if not evaluation.validation_ok:
            return False
        if evaluation.enabled_modules is None:
            return True
        return module_key in evaluation.enabled_modules

    def _audit_validation_failure(
        self, organization_id: UUID, code: str, message: str
    ) -> None:
        record_platform_audit(
            self.db,
            organization_id=organization_id,
            actor="system",
            entity_type="SoftwareLicense",
            entity_id=organization_id,
            action=AuditAction.UPDATE,
            notes=f"license_validation_failure:{code}",
            new_value={"code": code, "message": message},
        )


def _days_remaining(now: datetime, expires_at: datetime) -> int:
    exp = _ensure_utc(expires_at)
    delta = exp - _ensure_utc(now)
    return max(0, delta.days)


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
