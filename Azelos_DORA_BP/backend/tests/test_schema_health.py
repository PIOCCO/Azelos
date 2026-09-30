from app.core.schema_health import schema_migration_status


def test_schema_migration_status_ok(db_session):
    status = schema_migration_status(db_session)
    assert status["alembic_head"] is not None
    assert status["pending_migrations"] is False
    assert status["risk_lifecycle_columns_ok"] is True
    assert status["ok"] is True
    assert status["fix_hint"] is None
