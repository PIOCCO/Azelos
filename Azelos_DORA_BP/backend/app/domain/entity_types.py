"""Allowlisted entity types for custom fields (no arbitrary SQL targets)."""

from enum import Enum


class ConfigurableEntityType(str, Enum):
    FINANCIAL_ENTITY = "financial_entity"
    ICT_PROVIDER = "ict_provider"
    CONTRACT = "contract"
    ICT_SERVICE = "ict_service"
    BUSINESS_FUNCTION = "business_function"
    EVIDENCE = "evidence"
    RISK_ASSESSMENT = "risk_assessment"
    EXIT_STRATEGY = "exit_strategy"


ALLOWED_ENTITY_TYPES: frozenset[str] = frozenset(e.value for e in ConfigurableEntityType)
