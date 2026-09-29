"""Application settings (Pydantic)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.config.database import load_database_settings


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Azelos DORA Blueprint API"
    api_v1_prefix: str = "/api/v1"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "*"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_database_settings():
    return load_database_settings()
