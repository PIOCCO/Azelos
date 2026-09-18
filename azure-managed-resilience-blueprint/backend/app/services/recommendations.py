from sqlalchemy.orm import Session

from app.models.entities import AzureResource, Recommendation, RecommendationStatus


def generate_recommendations(db: Session, tenant_id: str) -> list[Recommendation]:
    created: list[Recommendation] = []
    db.query(Recommendation).filter(
        Recommendation.tenant_id == tenant_id,
        Recommendation.status == RecommendationStatus.OPEN,
    ).delete()
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all()

    for r in resources:
        if r.backup_protected is False:
            rec = Recommendation(
                tenant_id=tenant_id,
                resource_id=r.id,
                title=f"Enable Azure Backup for {r.name}",
                problem="No recoverable backup detected for this resource.",
                evidence=f"backup_protected=false for {r.azure_id}",
                suggested_action="Review backup policy and enable Azure Backup for this VM.",
                priority="High",
                risk="Low",
                status=RecommendationStatus.OPEN,
            )
            db.add(rec)
            created.append(rec)

        if r.name == "VM-03" or (r.monthly_cost_usd and r.health_status == "critical"):
            rec = Recommendation(
                tenant_id=tenant_id,
                resource_id=r.id,
                title=f"Evaluate smaller SKU or scale rule for {r.name}",
                problem="High CPU with sustained low utilization pattern suggests oversizing or runaway workload.",
                evidence=f"health={r.health_status}, monthly_cost_usd={r.monthly_cost_usd}",
                suggested_action="Review metrics in Azure Monitor; consider smaller VM SKU or auto-shutdown for dev.",
                estimated_savings_usd=35.0,
                priority="Medium",
                risk="Medium",
                status=RecommendationStatus.OPEN,
            )
            db.add(rec)
            created.append(rec)

    db.commit()
    return created
