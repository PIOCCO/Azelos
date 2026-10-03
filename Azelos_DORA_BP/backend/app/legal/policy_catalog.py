"""Platform policy catalog — versioned; bump version when material changes require re-acceptance."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

PolicyKey = Literal[
    "terms_of_service",
    "privacy_policy",
    "data_loss_service_disclaimer",
    "acceptable_use",
    "security_responsibility",
]

APP_RELEASE_VERSION = "1.0.0"


@dataclass(frozen=True)
class PolicyDefinition:
    key: PolicyKey
    version: str
    title_en: str
    title_fr: str


REQUIRED_POLICIES: tuple[PolicyDefinition, ...] = (
    PolicyDefinition("terms_of_service", "1.0", "Terms of Service", "Conditions d'utilisation"),
    PolicyDefinition("privacy_policy", "1.0", "Privacy Policy", "Politique de confidentialité"),
    PolicyDefinition(
        "data_loss_service_disclaimer",
        "1.0",
        "Data Loss & Service Availability Disclaimer",
        "Avertissement — perte de données et disponibilité du service",
    ),
    PolicyDefinition("acceptable_use", "1.0", "Acceptable Use Policy", "Politique d'utilisation acceptable"),
    PolicyDefinition(
        "security_responsibility",
        "1.0",
        "Security & Responsibility Disclaimer",
        "Avertissement — sécurité et responsabilités",
    ),
)


def current_policy_versions() -> dict[PolicyKey, str]:
    return {p.key: p.version for p in REQUIRED_POLICIES}


def policy_definition(key: PolicyKey) -> PolicyDefinition | None:
    for p in REQUIRED_POLICIES:
        if p.key == key:
            return p
    return None
