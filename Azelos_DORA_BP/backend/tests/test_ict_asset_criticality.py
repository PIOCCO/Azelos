from app.models.business_function import BusinessFunction
from app.models.enums import BusinessFunctionStatus, CriticalOrImportant
from app.models.financial_entity import FinancialEntity
from app.models.ict_assets import ICTAsset
from app.schemas.ict_assets import AssetFunctionMapCreate, ICTAssetCreate
from app.services.ict_assets import ICTAssetService


def test_mapping_does_not_overwrite_inherent_criticality(db_session):
    org = FinancialEntity(legal_name="Bank", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    fn = BusinessFunction(
        financial_entity_id=org.id,
        name="Payments",
        function_identifier="PAY-01",
        critical_or_important=CriticalOrImportant.CRITICAL,
        status=BusinessFunctionStatus.ACTIVE,
    )
    db_session.add(fn)
    db_session.flush()
    service = ICTAssetService(db_session, org.id)
    asset = service.create(
        ICTAssetCreate(
            name="Core Ledger DB",
            asset_identifier="ICT-001",
            inherent_criticality=CriticalOrImportant.NEITHER,
        )
    )
    mapping = service.map_to_function(
        AssetFunctionMapCreate(
            function_id=fn.id,
            ict_asset_id=asset.id,
            supports_critical_function=False,
        )
    )
    db_session.refresh(asset)
    assert asset.inherent_criticality == CriticalOrImportant.NEITHER
    assert mapping.supports_critical_function is True
