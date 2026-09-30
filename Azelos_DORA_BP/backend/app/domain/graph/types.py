"""Graph domain types — visualization-neutral nodes and edges."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class EntityType(str, Enum):
    BUSINESS_FUNCTION = "BusinessFunction"
    INFORMATION_ASSET = "InformationAsset"
    ICT_ASSET = "ICTAsset"
    ICT_SERVICE = "ICTService"
    ICT_PROVIDER = "ICTProvider"
    CONTRACT = "Contract"
    SUBCONTRACTOR = "Subcontractor"
    RISK_ASSESSMENT = "RiskAssessment"
    DORA_CONTROL = "DoraControlDefinition"
    CONTRACT_CONTROL = "ContractDoraControl"
    EVIDENCE = "Evidence"
    BUSINESS_SERVICE = "BusinessService"
    CLOUD_RESOURCE = "CloudResource"
    RESILIENCE_FINDING = "ResilienceFinding"
    REMEDIATION_ACTION = "RemediationAction"


class RelationshipType(str, Enum):
    SUPPORTS = "SUPPORTS"
    REALIZED_BY = "REALIZED_BY"
    UNDER_CONTRACT = "UNDER_CONTRACT"
    PROVIDED_BY = "PROVIDED_BY"
    ASSESSES = "ASSESSES"
    DEFINES = "DEFINES"
    EVIDENCED_BY = "EVIDENCED_BY"
    SUB_OUTSOURCES = "SUB_OUTSOURCES"
    USES_RESOURCE = "USES_RESOURCE"
    DEPENDS_ON = "DEPENDS_ON"
    FINDING_ON = "FINDING_ON"
    REMEDIATES = "REMEDIATES"


class GraphView(str, Enum):
    ALL = "ALL"
    RISK = "RISK"
    RESILIENCE = "RESILIENCE"


MAX_GRAPH_DEPTH = 3
MAX_GRAPH_NODES = 250
DEFAULT_OVERVIEW_MAX_NODES = 120
DEFAULT_OVERVIEW_ANCHORS = 6


def node_key(entity_type: EntityType, entity_id: str) -> str:
    return f"{entity_type.value}:{entity_id}"


def parse_node_key(key: str) -> tuple[EntityType, str]:
    prefix, _, raw_id = key.partition(":")
    return EntityType(prefix), raw_id


@dataclass
class GraphNodeDTO:
    id: str
    type: str
    label: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdgeDTO:
    id: str
    source: str
    target: str
    relationship: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class EntityGraphDTO:
    nodes: list[GraphNodeDTO]
    edges: list[GraphEdgeDTO]
