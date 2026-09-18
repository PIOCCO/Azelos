from sqlalchemy.orm import Session

from app.models.entities import AzureResource, Recommendation, RecommendationCategory, RecommendationStatus


def generate_recommendations(db: Session, tenant_id: str) -> list[Recommendation]:
    created: list[Recommendation] = []
    db.query(Recommendation).filter(
        Recommendation.tenant_id == tenant_id,
        Recommendation.status == RecommendationStatus.OPEN,
    ).delete()
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all()

    for r in resources:
        if r.backup_protected is False and "virtualMachines" in r.resource_type:
            rec = Recommendation(
                tenant_id=tenant_id,
                resource_id=r.id,
                category=RecommendationCategory.BACKUP,
                title=f"Enable Azure Backup for {r.name}",
                problem="No recoverable backup detected for this resource.",
                evidence=f"backup_protected=false for {r.azure_id}",
                suggested_action="Review backup policy and enable Azure Backup for this virtual machine.",
                expected_benefit="Recoverable restore points within your RPO target.",
                rollback_info="Disable backup policy only after confirming alternative protection.",
                priority="High",
                risk="Low",
                status=RecommendationStatus.OPEN,
            )
            db.add(rec)
            created.append(rec)

        if r.health_status == "critical" or (r.monthly_cost_usd and r.monthly_cost_usd > 100):
            rec = Recommendation(
                tenant_id=tenant_id,
                resource_id=r.id,
                category=RecommendationCategory.FINOPS,
                title=f"Right-size or tune {r.name}",
                problem="High utilization or cost suggests oversizing or runaway workload.",
                evidence=f"health={r.health_status}, monthly_cost_usd={r.monthly_cost_usd}",
                suggested_action="Review Azure Monitor metrics; evaluate smaller SKU or auto-shutdown schedule.",
                expected_benefit="Lower compute cost and improved performance headroom.",
                rollback_info="Revert SKU change via Azure Portal or redeploy previous VM size.",
                estimated_savings_usd=35.0,
                priority="Medium",
                risk="Medium",
                status=RecommendationStatus.OPEN,
            )
            db.add(rec)
            created.append(rec)

    db.commit()
    return created
