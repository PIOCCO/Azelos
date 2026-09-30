"""Application settings (Pydantic)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.config.database import load_database_settings


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Azelos DORA Blueprint API"
    api_v1_prefix: str = "/api/v1"
    app_env: str = "development"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "*"
    graphql_introspection_enabled: bool = True
    expose_error_details: bool = False
    oidc_enabled: bool = False
    oidc_issuer_url: str = ""
    oidc_client_id: str = ""
    oidc_client_secret: str = ""
    allow_tenant_self_signup: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_database_settings():
    return load_database_settings()
