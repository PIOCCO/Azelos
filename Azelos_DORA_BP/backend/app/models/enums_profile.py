"""Organization profile controlled vocabularies."""

import enum


class OrganizationType(str, enum.Enum):
    CREDIT_INSTITUTION = "credit_institution"
    PAYMENT_INSTITUTION = "payment_institution"
    E_MONEY_INSTITUTION = "e_money_institution"
    INVESTMENT_FIRM = "investment_firm"
    INSURANCE_UNDERTAKING = "insurance_undertaking"
    REINSURANCE_UNDERTAKING = "reinsurance_undertaking"
    CASP = "casp"
    OTHER_FINANCIAL_ENTITY = "other_financial_entity"


class OrganizationSizeCategory(str, enum.Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    GROUP = "group"


class RegulatoryStatus(str, enum.Enum):
    AUTHORIZED = "authorized"
    PASSPORTING = "passporting"
    PENDING = "pending"
    OTHER = "other"
