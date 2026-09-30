"""Fail fast when production configuration is unsafe."""

from app.core.config import Settings


def validate_production_settings(settings: Settings) -> None:
    if settings.app_env.lower() != "production":
        return
    if settings.jwt_secret_key == "change-me-in-production" or len(settings.jwt_secret_key) < 32:
        raise RuntimeError(
            "Production requires JWT_SECRET_KEY of at least 32 characters (not the default)."
        )
    if settings.cors_origins.strip() == "*":
        raise RuntimeError("Production cannot use CORS_ORIGINS=*")
