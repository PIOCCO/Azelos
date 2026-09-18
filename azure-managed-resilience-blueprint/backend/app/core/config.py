from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    azure_mock: bool = True
    database_url: str = "postgresql+psycopg://amrf:amrf@localhost:5432/amrf"
    jwt_secret: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    azure_subscription_id: str = ""
    azure_tenant_id: str = ""

    dev_provider_email: str = "provider@example.com"
    dev_provider_password: str = "Provider123!"

    budget_usd: float = 200.0
    budget_warn_usd: float = 100.0
    budget_critical_usd: float = 150.0
    budget_emergency_usd: float = 180.0


settings = Settings()
