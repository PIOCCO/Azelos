from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    app_profile: str = "dev"
    tenant_id: str = "default"

    database_url: str = "postgresql+psycopg://paic:paic@localhost:5432/paic"
    redis_url: str = "redis://localhost:6379/0"

    object_storage_endpoint: str = "http://localhost:9000"
    object_storage_access_key: str = "minioadmin"
    object_storage_secret_key: str = "minioadmin"
    object_storage_bucket: str = "documents"
    object_storage_secure: bool = False

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    llm_provider: str = "ollama"
    llm_model: str = "llama3.2:1b"
    llm_base_url: str = "http://localhost:11434"
    llm_mock: bool = False

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    reranker_enabled: bool = False

    max_file_size_mb: int = 25
    allowed_file_types: str = "pdf,docx,txt,csv,xlsx,md"

    document_retention_days: int = 365
    chat_retention_days: int = 90

    cors_origins: str = "http://localhost:5173,http://localhost:5174"


settings = Settings()
