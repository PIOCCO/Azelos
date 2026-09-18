import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"  # development | staging | production
    app_env: str = "dev"  # legacy alias used in health
    auth_mode: str = "jwt"  # jwt | entra (entra planned)

    demo_mode: bool = True
    azure_mock: bool = True  # legacy: maps to demo_mode when DEMO_MODE unset

    database_url: str = "postgresql+psycopg://amrf:amrf@localhost:5432/amrf"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    cors_origins: str = "http://localhost:5175,http://localhost:5173,http://localhost"
    trusted_hosts: str = "*"

    azure_subscription_id: str = ""
    azure_tenant_id: str = ""

    dev_provider_email: str = "provider@example.com"
    dev_provider_password: str = "Provider123!"

    rate_limit_per_minute: int = 120

    budget_usd: float = 200.0
    budget_warn_usd: float = 100.0
    budget_critical_usd: float = 150.0
    budget_emergency_usd: float = 180.0

    product_name: str = "Atlas Azure Resilience"
    sync_schedule_cron: str = "0 * * * *"

    def model_post_init(self, __context) -> None:
        if os.getenv("DEMO_MODE") is not None:
            self.demo_mode = os.getenv("DEMO_MODE", "").lower() in ("1", "true", "yes")
        else:
            self.demo_mode = bool(self.azure_mock)

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()


def validate_production_settings() -> None:
    if not settings.is_production:
        return
    if settings.auth_mode.lower() != "entra":
        raise RuntimeError("Production requires AUTH_MODE=entra (JWT is development-only).")
    if settings.demo_mode:
        raise RuntimeError("Production cannot run with DEMO_MODE=true.")
    if settings.jwt_secret in ("dev-secret", "dev-secret-change-me", "change-me-dev-only"):
        raise RuntimeError("Production requires a strong JWT_SECRET or Entra-only auth.")
    if settings.dev_provider_password == "Provider123!":
        raise RuntimeError("Remove default DEV_PROVIDER_PASSWORD in production.")
