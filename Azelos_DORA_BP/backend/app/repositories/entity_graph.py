"""Org-scoped graph expansion — batch SQL, no N+1 per edge."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.domain.graph.types import EntityType, GraphEdgeDTO, GraphNodeDTO, RelationshipType, node_key
from app.models.business_function import BusinessFunction, FunctionServiceMapping
from app.models.enums import CriticalOrImportant
from app.models.cloud_resilience import (
    BusinessService,
    CloudResource,
    RemediationAction,
    ResilienceFinding,
    ServiceDependency,
)
from app.models.contract import Contract
from app.models.dora_control import ContractDoraControl, DoraControlDefinition, EvidenceControlLink
from app.models.evidence import Evidence
from app.models.ict_assets import AssetFunctionMap, ICTAsset, InformationAsset
from app.models.provider import ICTProvider
from app.models.enums_operational import IncidentLinkKind
from app.models.operational import ICTIncident, IncidentEntityLink
from app.repositories.risk_assessment_read import RiskAssessmentReader, RiskGraphSlice
from app.models.risk import RiskAssessment
from app.models.service import ICTService
from app.models.subcontractor import Subcontractor


class EntityGraphRepository:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id
        self._risks = RiskAssessmentReader(db)

    def list_graph_anchors(self, limit: int = 6) -> list[tuple[EntityType, UUID]]:
        """Seed entities for org overview graph (critical functions first)."""
        org = self.organization_id
        anchors: list[tuple[EntityType, UUID]] = []
        seen: set[tuple[EntityType, UUID]] = set()

        def add(etype: EntityType, eid: UUID) -> None:
            key = (etype, eid)
            if key not in seen and len(anchors) < limit:
                seen.add(key)
                anchors.append(key)

        for row in self.db.scalars(
            select(BusinessFunction)
            .where(
                BusinessFunction.financial_entity_id == org,
                BusinessFunction.critical_or_important == CriticalOrImportant.CRITICAL,
            )
            .order_by(BusinessFunction.name)
            .limit(limit)
        ):
            add(EntityType.BUSINESS_FUNCTION, row.id)

        for row in self.db.scalars(
            select(BusinessFunction)
            .where(
                BusinessFunction.financial_entity_id == org,
                BusinessFunction.critical_or_important == CriticalOrImportant.IMPORTANT,
            )
            .order_by(BusinessFunction.name)
            .limit(limit)
        ):
            add(EntityType.BUSINESS_FUNCTION, row.id)

        for row in self.db.scalars(
            select(BusinessFunction)
            .where(BusinessFunction.financial_entity_id == org)
            .order_by(BusinessFunction.name)
            .limit(limit)
        ):
            add(EntityType.BUSINESS_FUNCTION, row.id)

        for row in self.db.scalars(
            select(ICTAsset)
            .where(ICTAsset.financial_entity_id == org)
            .order_by(ICTAsset.name)
            .limit(limit)
        ):
            add(EntityType.ICT_ASSET, row.id)

        for row in self.db.scalars(
            select(BusinessService)
            .where(BusinessService.financial_entity_id == org)
            .order_by(BusinessService.name)
            .limit(limit)
        ):
            add(EntityType.BUSINESS_SERVICE, row.id)

        for row in self.db.scalars(
            select(ICTProvider)
            .where(ICTProvider.financial_entity_id == org)
            .order_by(ICTProvider.legal_name)
            .limit(limit)
        ):
            add(EntityType.ICT_PROVIDER, row.id)

        return anchors[:limit]

    def search_entities(self, query: str, limit: int = 20) -> list[GraphNodeDTO]:
        q = f"%{query.strip()}%"
        if not query.strip():
            return []
        nodes: list[GraphNodeDTO] = []
        org = self.organization_id

        for row in self.db.scalars(
            select(BusinessFunction)
            .where(BusinessFunction.financial_entity_id == org, BusinessFunction.name.ilike(q))
            .limit(limit)
        ):
            nodes.append(self._bf_node(row))
        for row in self.db.scalars(
            select(ICTAsset)
            .where(ICTAsset.financial_entity_id == org, ICTAsset.name.ilike(q))
            .limit(limit)
        ):
            nodes.append(self._ict_node(row))
        for row in self.db.scalars(
            select(ICTService)
            .where(ICTService.financial_entity_id == org, ICTService.name.ilike(q))
            .limit(limit)
        ):
            nodes.append(self._svc_node(row))
        for row in self.db.scalars(
            select(ICTProvider)
            .where(ICTProvider.financial_entity_id == org, ICTProvider.legal_name.ilike(q))
            .limit(limit)
        ):
            nodes.append(self._prov_node(row))
        for row in self.db.scalars(
            select(BusinessService)
            .where(BusinessService.financial_entity_id == org, BusinessService.name.ilike(q))
            .limit(limit)
        ):
            nodes.append(self._bsvc_node(row))
        for row in self.db.scalars(
            select(ICTIncident)
            .where(
                ICTIncident.financial_entity_id == org,
                ICTIncident.archived_at.is_(None),
                ICTIncident.title.ilike(q),
            )
            .limit(limit)
        ):
            nodes.append(self._incident_node(row))
        return nodes[:limit]

    def get_node(self, entity_type: EntityType, entity_id: UUID) -> GraphNodeDTO | None:
        org = self.organization_id
        if entity_type == EntityType.BUSINESS_FUNCTION:
            row = self.db.get(BusinessFunction, entity_id)
            if row and row.financial_entity_id == org:
                return self._bf_node(row)
        elif entity_type == EntityType.ICT_ASSET:
            row = self.db.get(ICTAsset, entity_id)
            if row and row.financial_entity_id == org:
                return self._ict_node(row)
        elif entity_type == EntityType.INFORMATION_ASSET:
            row = self.db.get(InformationAsset, entity_id)
            if row and row.financial_entity_id == org:
                return self._info_node(row)
        elif entity_type == EntityType.ICT_SERVICE:
            row = self.db.get(ICTService, entity_id)
            if row and row.financial_entity_id == org:
                return self._svc_node(row)
        elif entity_type == EntityType.ICT_PROVIDER:
            row = self.db.get(ICTProvider, entity_id)
            if row and row.financial_entity_id == org:
                return self._prov_node(row)
        elif entity_type == EntityType.CONTRACT:
            row = self.db.get(Contract, entity_id)
            if row and row.financial_entity_id == org:
                return self._contract_node(row)
        elif entity_type == EntityType.RISK_ASSESSMENT:
            row = self._risks.get(entity_id)
            if row and row.financial_entity_id == org:
                return self._risk_node(row)
        elif entity_type == EntityType.BUSINESS_SERVICE:
            row = self.db.get(BusinessService, entity_id)
            if row and row.financial_entity_id == org:
                return self._bsvc_node(row)
        elif entity_type == EntityType.RESILIENCE_FINDING:
            row = self.db.get(ResilienceFinding, entity_id)
            if row and row.financial_entity_id == org:
                return self._finding_node(row)
        elif entity_type == EntityType.ICT_INCIDENT:
            row = self.db.get(ICTIncident, entity_id)
            if row and row.financial_entity_id == org and row.archived_at is None:
                return self._incident_node(row)
        return None

    def expand(
        self,
        entity_type: EntityType,
        entity_id: UUID,
        *,
        view: str = "ALL",
    ) -> tuple[list[GraphNodeDTO], list[GraphEdgeDTO]]:
        org = self.organization_id
        nodes: list[GraphNodeDTO] = []
        edges: list[GraphEdgeDTO] = []

        if entity_type == EntityType.BUSINESS_FUNCTION:
            bf = self.db.get(BusinessFunction, entity_id)
            if not bf or bf.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.BUSINESS_FUNCTION, str(bf.id))
            for m in self.db.scalars(
                select(AssetFunctionMap)
                .options(selectinload(AssetFunctionMap.ict_asset))
                .where(AssetFunctionMap.function_id == bf.id)
            ):
                asset = m.ict_asset
                if asset.financial_entity_id != org:
                    continue
                tid = node_key(EntityType.ICT_ASSET, str(asset.id))
                nodes.append(self._ict_node(asset))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{tid}:SUPPORTS",
                        source=center,
                        target=tid,
                        relationship=RelationshipType.SUPPORTS.value,
                        metadata={"supports_critical_function": m.supports_critical_function},
                    )
                )
            for m in self.db.scalars(
                select(FunctionServiceMapping)
                .options(selectinload(FunctionServiceMapping.service))
                .where(FunctionServiceMapping.function_id == bf.id)
            ):
                svc = m.service
                if svc.financial_entity_id != org:
                    continue
                tid = node_key(EntityType.ICT_SERVICE, str(svc.id))
                nodes.append(self._svc_node(svc))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{tid}:SUPPORTS",
                        source=center,
                        target=tid,
                        relationship=RelationshipType.SUPPORTS.value,
                        metadata={},
                    )
                )

        elif entity_type == EntityType.ICT_ASSET:
            asset = self.db.get(ICTAsset, entity_id)
            if not asset or asset.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.ICT_ASSET, str(asset.id))
            if asset.information_asset_id:
                info = self.db.get(InformationAsset, asset.information_asset_id)
                if info and info.financial_entity_id == org:
                    tid = node_key(EntityType.INFORMATION_ASSET, str(info.id))
                    nodes.append(self._info_node(info))
                    edges.append(
                        GraphEdgeDTO(
                            id=f"{tid}->{center}:REALIZED_BY",
                            source=tid,
                            target=center,
                            relationship=RelationshipType.REALIZED_BY.value,
                            metadata={},
                        )
                    )
            for m in self.db.scalars(
                select(AssetFunctionMap)
                .options(selectinload(AssetFunctionMap.business_function))
                .where(AssetFunctionMap.ict_asset_id == asset.id)
            ):
                bf = m.business_function
                if bf.financial_entity_id != org:
                    continue
                tid = node_key(EntityType.BUSINESS_FUNCTION, str(bf.id))
                nodes.append(self._bf_node(bf))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{tid}->{center}:SUPPORTS",
                        source=tid,
                        target=center,
                        relationship=RelationshipType.SUPPORTS.value,
                        metadata={"supports_critical_function": m.supports_critical_function},
                    )
                )
        elif entity_type == EntityType.INFORMATION_ASSET:
            info = self.db.get(InformationAsset, entity_id)
            if not info or info.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.INFORMATION_ASSET, str(info.id))
            for asset in self.db.scalars(
                select(ICTAsset).where(
                    ICTAsset.financial_entity_id == org,
                    ICTAsset.information_asset_id == info.id,
                )
            ):
                tid = node_key(EntityType.ICT_ASSET, str(asset.id))
                nodes.append(self._ict_node(asset))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{tid}:REALIZED_BY",
                        source=center,
                        target=tid,
                        relationship=RelationshipType.REALIZED_BY.value,
                        metadata={},
                    )
                )

        elif entity_type == EntityType.ICT_SERVICE:
            svc = self.db.get(ICTService, entity_id)
            if not svc or svc.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.ICT_SERVICE, str(svc.id))
            contract = self.db.get(Contract, svc.contract_id)
            if contract and contract.financial_entity_id == org:
                tid = node_key(EntityType.CONTRACT, str(contract.id))
                nodes.append(self._contract_node(contract))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{tid}:UNDER_CONTRACT",
                        source=center,
                        target=tid,
                        relationship=RelationshipType.UNDER_CONTRACT.value,
                        metadata={},
                    )
                )
            for m in self.db.scalars(
                select(FunctionServiceMapping)
                .options(selectinload(FunctionServiceMapping.business_function))
                .where(FunctionServiceMapping.service_id == svc.id)
            ):
                bf = m.business_function
                if bf.financial_entity_id != org:
                    continue
                tid = node_key(EntityType.BUSINESS_FUNCTION, str(bf.id))
                nodes.append(self._bf_node(bf))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{tid}->{center}:SUPPORTS",
                        source=tid,
                        target=center,
                        relationship=RelationshipType.SUPPORTS.value,
                        metadata={},
                    )
                )
            if view in ("ALL", "RISK"):
                for risk in self._risks.list_for_service(org, svc.id):
                    tid = node_key(EntityType.RISK_ASSESSMENT, str(risk.id))
                    nodes.append(self._risk_node(risk))
                    edges.append(
                        GraphEdgeDTO(
                            id=f"{tid}->{center}:ASSESSES",
                            source=tid,
                            target=center,
                            relationship=RelationshipType.ASSESSES.value,
                            metadata={},
                        )
                    )

        elif entity_type == EntityType.CONTRACT:
            contract = self.db.get(Contract, entity_id)
            if not contract or contract.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.CONTRACT, str(contract.id))
            prov = self.db.get(ICTProvider, contract.provider_id)
            if prov and prov.financial_entity_id == org:
                tid = node_key(EntityType.ICT_PROVIDER, str(prov.id))
                nodes.append(self._prov_node(prov))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{tid}:PROVIDED_BY",
                        source=center,
                        target=tid,
                        relationship=RelationshipType.PROVIDED_BY.value,
                        metadata={},
                    )
                )
            for svc in self.db.scalars(
                select(ICTService).where(
                    ICTService.financial_entity_id == org,
                    ICTService.contract_id == contract.id,
                )
            ):
                tid = node_key(EntityType.ICT_SERVICE, str(svc.id))
                nodes.append(self._svc_node(svc))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{tid}->{center}:UNDER_CONTRACT",
                        source=tid,
                        target=center,
                        relationship=RelationshipType.UNDER_CONTRACT.value,
                        metadata={},
                    )
                )
            if view in ("ALL", "RISK"):
                for risk in self._risks.list_for_contract(org, contract.id):
                    tid = node_key(EntityType.RISK_ASSESSMENT, str(risk.id))
                    nodes.append(self._risk_node(risk))
                    edges.append(
                        GraphEdgeDTO(
                            id=f"{tid}->{center}:ASSESSES",
                            source=tid,
                            target=center,
                            relationship=RelationshipType.ASSESSES.value,
                            metadata={},
                        )
                    )
                for ctrl in self.db.scalars(
                    select(ContractDoraControl)
                    .options(selectinload(ContractDoraControl.control_definition))
                    .where(
                        ContractDoraControl.financial_entity_id == org,
                        ContractDoraControl.contract_id == contract.id,
                    )
                ):
                    defn = ctrl.control_definition
                    cid = node_key(EntityType.CONTRACT_CONTROL, str(ctrl.id))
                    did = node_key(EntityType.DORA_CONTROL, str(defn.id))
                    nodes.append(self._ctrl_node(defn, ctrl))
                    edges.append(
                        GraphEdgeDTO(
                            id=f"{cid}->{did}:DEFINES",
                            source=cid,
                            target=did,
                            relationship=RelationshipType.DEFINES.value,
                            metadata={"compliance_status": ctrl.compliance_status.value},
                        )
                    )
                    edges.append(
                        GraphEdgeDTO(
                            id=f"{center}->{cid}:DEFINES",
                            source=center,
                            target=cid,
                            relationship=RelationshipType.DEFINES.value,
                            metadata={},
                        )
                    )
                    for link in self.db.scalars(
                        select(EvidenceControlLink)
                        .options(selectinload(EvidenceControlLink.evidence))
                        .where(EvidenceControlLink.contract_control_id == ctrl.id)
                    ):
                        ev = link.evidence
                        if ev.financial_entity_id != org:
                            continue
                        eid = node_key(EntityType.EVIDENCE, str(ev.id))
                        nodes.append(self._evidence_node(ev))
                        edges.append(
                            GraphEdgeDTO(
                                id=f"{eid}->{cid}:EVIDENCED_BY",
                                source=eid,
                                target=cid,
                                relationship=RelationshipType.EVIDENCED_BY.value,
                                metadata={},
                            )
                        )

        elif entity_type == EntityType.ICT_PROVIDER:
            prov = self.db.get(ICTProvider, entity_id)
            if not prov or prov.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.ICT_PROVIDER, str(prov.id))
            for contract in self.db.scalars(
                select(Contract).where(
                    Contract.financial_entity_id == org,
                    Contract.provider_id == prov.id,
                )
            ):
                tid = node_key(EntityType.CONTRACT, str(contract.id))
                nodes.append(self._contract_node(contract))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{tid}->{center}:PROVIDED_BY",
                        source=tid,
                        target=center,
                        relationship=RelationshipType.PROVIDED_BY.value,
                        metadata={},
                    )
                )
            for sub in self.db.scalars(
                select(Subcontractor).where(
                    Subcontractor.financial_entity_id == org,
                    Subcontractor.provider_id == prov.id,
                    Subcontractor.parent_subcontractor_id.is_(None),
                )
            ):
                tid = node_key(EntityType.SUBCONTRACTOR, str(sub.id))
                nodes.append(self._sub_node(sub))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{tid}:SUB_OUTSOURCES",
                        source=center,
                        target=tid,
                        relationship=RelationshipType.SUB_OUTSOURCES.value,
                        metadata={"depth_rank": sub.depth_rank},
                    )
                )

        elif entity_type == EntityType.RISK_ASSESSMENT:
            risk = self._risks.get(entity_id)
            if not risk or risk.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.RISK_ASSESSMENT, str(risk.id))
            if risk.service_id:
                svc = self.db.get(ICTService, risk.service_id)
                if svc and svc.financial_entity_id == org:
                    tid = node_key(EntityType.ICT_SERVICE, str(svc.id))
                    nodes.append(self._svc_node(svc))
                    edges.append(
                        GraphEdgeDTO(
                            id=f"{center}->{tid}:ASSESSES",
                            source=center,
                            target=tid,
                            relationship=RelationshipType.ASSESSES.value,
                            metadata={},
                        )
                    )
            if risk.contract_id:
                contract = self.db.get(Contract, risk.contract_id)
                if contract and contract.financial_entity_id == org:
                    tid = node_key(EntityType.CONTRACT, str(contract.id))
                    nodes.append(self._contract_node(contract))
                    edges.append(
                        GraphEdgeDTO(
                            id=f"{center}->{tid}:ASSESSES",
                            source=center,
                            target=tid,
                            relationship=RelationshipType.ASSESSES.value,
                            metadata={},
                        )
                    )
            if risk.provider_id:
                prov = self.db.get(ICTProvider, risk.provider_id)
                if prov and prov.financial_entity_id == org:
                    tid = node_key(EntityType.ICT_PROVIDER, str(prov.id))
                    nodes.append(self._prov_node(prov))
                    edges.append(
                        GraphEdgeDTO(
                            id=f"{center}->{tid}:ASSESSES",
                            source=center,
                            target=tid,
                            relationship=RelationshipType.ASSESSES.value,
                            metadata={},
                        )
                    )

        elif entity_type == EntityType.ICT_INCIDENT:
            inc = self.db.get(ICTIncident, entity_id)
            if not inc or inc.financial_entity_id != org or inc.archived_at is not None:
                return [], []
            center = node_key(EntityType.ICT_INCIDENT, str(inc.id))
            for link in self.db.scalars(
                select(IncidentEntityLink).where(IncidentEntityLink.incident_id == inc.id)
            ):
                etype = self._link_kind_to_entity(link.link_kind)
                target = self.get_node(etype, link.linked_entity_id)
                if target is None:
                    continue
                tid = target.id
                nodes.append(target)
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{tid}:AFFECTS",
                        source=center,
                        target=tid,
                        relationship=RelationshipType.AFFECTS.value,
                        metadata={
                            "link_kind": link.link_kind.value,
                            "notes": link.notes,
                            "reason": "Linked on incident record",
                        },
                    )
                )

        elif entity_type == EntityType.BUSINESS_SERVICE and view in ("ALL", "RESILIENCE"):
            bsvc = self.db.get(BusinessService, entity_id)
            if not bsvc or bsvc.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.BUSINESS_SERVICE, str(bsvc.id))
            for res in self.db.scalars(
                select(CloudResource).where(
                    CloudResource.financial_entity_id == org,
                    CloudResource.business_service_id == bsvc.id,
                )
            ):
                tid = node_key(EntityType.CLOUD_RESOURCE, str(res.id))
                nodes.append(self._cloud_node(res))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{tid}:USES_RESOURCE",
                        source=center,
                        target=tid,
                        relationship=RelationshipType.USES_RESOURCE.value,
                        metadata={},
                    )
                )
            for dep in self.db.scalars(
                select(ServiceDependency).where(
                    ServiceDependency.financial_entity_id == org,
                    ServiceDependency.business_service_id == bsvc.id,
                )
            ):
                dep_key = f"ServiceDependency:{dep.id}"
                nodes.append(
                    GraphNodeDTO(
                        id=dep_key,
                        type="ServiceDependency",
                        label=dep.name,
                        metadata={"kind": dep.dependency_kind.value, "provenance": dep.provenance.value},
                    )
                )
                edges.append(
                    GraphEdgeDTO(
                        id=f"{center}->{dep_key}:DEPENDS_ON",
                        source=center,
                        target=dep_key,
                        relationship=RelationshipType.DEPENDS_ON.value,
                        metadata={},
                    )
                )
                if dep.cloud_resource_id:
                    cr = self.db.get(CloudResource, dep.cloud_resource_id)
                    if cr and cr.financial_entity_id == org:
                        crk = node_key(EntityType.CLOUD_RESOURCE, str(cr.id))
                        nodes.append(self._cloud_node(cr))
                        edges.append(
                            GraphEdgeDTO(
                                id=f"{dep_key}->{crk}:DEPENDS_ON",
                                source=dep_key,
                                target=crk,
                                relationship=RelationshipType.DEPENDS_ON.value,
                                metadata={},
                            )
                        )
            for finding in self.db.scalars(
                select(ResilienceFinding).where(
                    ResilienceFinding.financial_entity_id == org,
                    ResilienceFinding.business_service_id == bsvc.id,
                )
            ):
                fid = node_key(EntityType.RESILIENCE_FINDING, str(finding.id))
                nodes.append(self._finding_node(finding))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{fid}->{center}:FINDING_ON",
                        source=fid,
                        target=center,
                        relationship=RelationshipType.FINDING_ON.value,
                        metadata={"severity": finding.severity.value},
                    )
                )

        elif entity_type == EntityType.RESILIENCE_FINDING:
            finding = self.db.get(ResilienceFinding, entity_id)
            if not finding or finding.financial_entity_id != org:
                return [], []
            center = node_key(EntityType.RESILIENCE_FINDING, str(finding.id))
            for rem in self.db.scalars(
                select(RemediationAction).where(
                    RemediationAction.financial_entity_id == org,
                    RemediationAction.finding_id == finding.id,
                )
            ):
                rid = node_key(EntityType.REMEDIATION_ACTION, str(rem.id))
                nodes.append(self._remediation_node(rem))
                edges.append(
                    GraphEdgeDTO(
                        id=f"{rid}->{center}:REMEDIATES",
                        source=rid,
                        target=center,
                        relationship=RelationshipType.REMEDIATES.value,
                        metadata={"status": rem.status.value},
                    )
                )

        return nodes, edges

    def _bf_node(self, row: BusinessFunction) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.BUSINESS_FUNCTION, str(row.id)),
            type=EntityType.BUSINESS_FUNCTION.value,
            label=row.name,
            metadata={
                "critical_or_important": row.critical_or_important.value,
                "status": row.status.value,
                "function_identifier": row.function_identifier,
            },
        )

    def _ict_node(self, row: ICTAsset) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.ICT_ASSET, str(row.id)),
            type=EntityType.ICT_ASSET.value,
            label=row.name,
            metadata={
                "inherent_criticality": row.inherent_criticality.value,
                "asset_identifier": row.asset_identifier,
            },
        )

    def _info_node(self, row: InformationAsset) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.INFORMATION_ASSET, str(row.id)),
            type=EntityType.INFORMATION_ASSET.value,
            label=row.name,
            metadata={"asset_identifier": row.asset_identifier},
        )

    def _svc_node(self, row: ICTService) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.ICT_SERVICE, str(row.id)),
            type=EntityType.ICT_SERVICE.value,
            label=row.name,
            metadata={
                "status": row.status.value,
                "supports_critical_or_important": row.supports_critical_or_important.value,
            },
        )

    def _prov_node(self, row: ICTProvider) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.ICT_PROVIDER, str(row.id)),
            type=EntityType.ICT_PROVIDER.value,
            label=row.legal_name,
            metadata={"status": row.status.value, "country_code": row.country_code},
        )

    def _contract_node(self, row: Contract) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.CONTRACT, str(row.id)),
            type=EntityType.CONTRACT.value,
            label=row.reference_number,
            metadata={"status": row.status.value, "contract_type": row.contract_type.value},
        )

    def _risk_node(self, row: RiskAssessment | RiskGraphSlice) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.RISK_ASSESSMENT, str(row.id)),
            type=EntityType.RISK_ASSESSMENT.value,
            label=f"Risk {row.resulting_risk_level.value}",
            metadata={
                "resulting_risk_level": row.resulting_risk_level.value,
                "calculated_at": row.calculated_at.isoformat() if row.calculated_at else None,
            },
        )

    def _ctrl_node(self, defn: DoraControlDefinition, ctrl: ContractDoraControl) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.CONTRACT_CONTROL, str(ctrl.id)),
            type=EntityType.CONTRACT_CONTROL.value,
            label=f"{defn.code} — {defn.name}",
            metadata={
                "control_code": defn.code,
                "compliance_status": ctrl.compliance_status.value,
            },
        )

    def _evidence_node(self, row: Evidence) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.EVIDENCE, str(row.id)),
            type=EntityType.EVIDENCE.value,
            label=row.file_name,
            metadata={"verification_status": row.verification_status.value},
        )

    def _sub_node(self, row: Subcontractor) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.SUBCONTRACTOR, str(row.id)),
            type=EntityType.SUBCONTRACTOR.value,
            label=row.legal_name,
            metadata={"depth_rank": row.depth_rank, "status": row.status.value},
        )

    def _bsvc_node(self, row: BusinessService) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.BUSINESS_SERVICE, str(row.id)),
            type=EntityType.BUSINESS_SERVICE.value,
            label=row.name,
            metadata={
                "criticality": row.criticality.value,
                "rto_minutes": row.rto_minutes,
                "rpo_minutes": row.rpo_minutes,
                "status": row.status.value,
            },
        )

    def _cloud_node(self, row: CloudResource) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.CLOUD_RESOURCE, str(row.id)),
            type=EntityType.CLOUD_RESOURCE.value,
            label=row.name,
            metadata={"resource_type": row.resource_type, "region": row.region},
        )

    def _finding_node(self, row: ResilienceFinding) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.RESILIENCE_FINDING, str(row.id)),
            type=EntityType.RESILIENCE_FINDING.value,
            label=row.title,
            metadata={"severity": row.severity.value, "status": row.status.value},
        )

    def _remediation_node(self, row: RemediationAction) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.REMEDIATION_ACTION, str(row.id)),
            type=EntityType.REMEDIATION_ACTION.value,
            label=row.title,
            metadata={"status": row.status.value},
        )

    def _incident_node(self, row: ICTIncident) -> GraphNodeDTO:
        return GraphNodeDTO(
            id=node_key(EntityType.ICT_INCIDENT, str(row.id)),
            type=EntityType.ICT_INCIDENT.value,
            label=row.title,
            metadata={
                "severity": row.severity.value,
                "status": row.status.value,
                "is_major": row.is_major,
            },
        )

    def _link_kind_to_entity(self, kind: IncidentLinkKind) -> EntityType:
        return {
            IncidentLinkKind.BUSINESS_SERVICE: EntityType.BUSINESS_SERVICE,
            IncidentLinkKind.BUSINESS_FUNCTION: EntityType.BUSINESS_FUNCTION,
            IncidentLinkKind.ICT_ASSET: EntityType.ICT_ASSET,
            IncidentLinkKind.ICT_SERVICE: EntityType.ICT_SERVICE,
            IncidentLinkKind.ICT_PROVIDER: EntityType.ICT_PROVIDER,
            IncidentLinkKind.RISK_ASSESSMENT: EntityType.RISK_ASSESSMENT,
        }[kind]
