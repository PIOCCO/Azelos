from __future__ import annotations

import uuid
from uuid import UUID

from fastapi import HTTPException, Request, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.legal.policy_catalog import (
    APP_RELEASE_VERSION,
    REQUIRED_POLICIES,
    PolicyKey,
    current_policy_versions,
    policy_definition,
)
from app.models.enums import AuditAction
from app.models.policy_acceptance import UserPolicyAcceptance
from app.services.platform_audit import record_platform_audit


POLICY_EXEMPT_PREFIXES = (
    "/api/v1/auth/",
    "/api/v1/policies/",
    "/api/v1/memberships/invitations/accept",
)


def is_policy_exempt_path(path: str) -> bool:
    if path in ("/health", "/ready", "/openapi.json", "/docs", "/redoc"):
        return True
    return any(path.startswith(p) for p in POLICY_EXEMPT_PREFIXES)


class PolicyAcceptanceService:
    def __init__(self, db: Session):
        self.db = db

    def missing_policies(self, user_id: UUID, organization_id: UUID) -> list[PolicyKey]:
        required = current_policy_versions()
        missing: list[PolicyKey] = []
        for key, version in required.items():
            if not self._has_acceptance(user_id, organization_id, key, version):
                missing.append(key)
        return missing

    def _has_acceptance(
        self, user_id: UUID, organization_id: UUID, policy_key: PolicyKey, policy_version: str
    ) -> bool:
        row = self.db.scalar(
            select(UserPolicyAcceptance)
            .where(
                UserPolicyAcceptance.user_id == user_id,
                UserPolicyAcceptance.financial_entity_id == organization_id,
                UserPolicyAcceptance.policy_key == policy_key,
                UserPolicyAcceptance.policy_version == policy_version,
            )
            .order_by(desc(UserPolicyAcceptance.accepted_at))
            .limit(1)
        )
        return row is not None

    def require_current_acceptance(self, user_id: UUID, organization_id: UUID) -> None:
        missing = self.missing_policies(user_id, organization_id)
        if not missing:
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "POLICY_ACCEPTANCE_REQUIRED",
                "message": "Mandatory policy acceptance required before using the platform.",
                "missing_policies": missing,
            },
        )

    def record_bundle_acceptance(
        self,
        user_id: UUID,
        organization_id: UUID,
        request: Request | None = None,
    ) -> list[UserPolicyAcceptance]:
        ip = None
        ua = None
        if request is not None:
            if request.client:
                ip = request.client.host
            ua = request.headers.get("user-agent")
            if ua:
                ua = ua[:2000]

        created: list[UserPolicyAcceptance] = []
        for policy in REQUIRED_POLICIES:
            if self._has_acceptance(user_id, organization_id, policy.key, policy.version):
                continue
            row = UserPolicyAcceptance(
                id=uuid.uuid4(),
                user_id=user_id,
                financial_entity_id=organization_id,
                policy_key=policy.key,
                policy_version=policy.version,
                app_version=APP_RELEASE_VERSION,
                ip_address=ip,
                user_agent=ua,
            )
            self.db.add(row)
            created.append(row)
            record_platform_audit(
                self.db,
                organization_id=organization_id,
                actor=str(user_id),
                entity_type="policy_acceptance",
                entity_id=row.id,
                action=AuditAction.APPROVE,
                new_value={
                    "policy_key": policy.key,
                    "policy_version": policy.version,
                    "app_version": APP_RELEASE_VERSION,
                },
            )
        self.db.flush()
        return created

    def status_payload(self, user_id: UUID, organization_id: UUID) -> dict:
        missing = self.missing_policies(user_id, organization_id)
        policies = []
        for p in REQUIRED_POLICIES:
            policies.append(
                {
                    "key": p.key,
                    "version": p.version,
                    "title_en": p.title_en,
                    "title_fr": p.title_fr,
                    "accepted": p.key not in missing,
                }
            )
        from app.core.config import get_settings

        enforced = get_settings().policy_acceptance_enforced
        return {
            "app_version": APP_RELEASE_VERSION,
            "enforcement_enabled": enforced,
            "all_accepted": len(missing) == 0 if enforced else True,
            "missing_policy_keys": missing if enforced else [],
            "policies": policies,
        }

    def document_payload(self, key: str, locale: str) -> dict:
        if key not in current_policy_versions():
            raise HTTPException(status_code=404, detail="Policy not found")
        defn = policy_definition(key)  # type: ignore[arg-type]
        if defn is None:
            raise HTTPException(status_code=404, detail="Policy not found")
        from app.legal.policy_content import get_policy_content

        loc = "fr" if locale.lower().startswith("fr") else "en"
        title = defn.title_fr if loc == "fr" else defn.title_en
        return {
            "key": defn.key,
            "version": defn.version,
            "locale": loc,
            "title": title,
            "content_markdown": get_policy_content(defn.key, loc),
        }
