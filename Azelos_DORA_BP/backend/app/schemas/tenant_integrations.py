from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class IntegrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    integration_type: str
    name: str
    status: str
    config: dict
    last_test_at: datetime | None
    last_test_success: bool | None
    last_test_message: str | None
    created_at: datetime
    updated_at: datetime


class PostgreSQLIntegrationUpsert(BaseModel):
    name: str = Field(default="PostgreSQL", max_length=128)
    host: str = Field(min_length=1, max_length=256)
    port: int = Field(default=5432, ge=1, le=65535)
    database: str = Field(min_length=1, max_length=128)
    username: str = Field(min_length=1, max_length=128)
    password: str | None = Field(default=None, max_length=512)
    ssl_mode: str = Field(default="prefer", max_length=32)


class HttpApiIntegrationUpsert(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    base_url: str = Field(min_length=1, max_length=512)
    auth_type: str = Field(default="bearer", pattern="^(bearer|api_key_header|none)$")
    api_key: str | None = Field(default=None, max_length=512)


class ConnectionTestResult(BaseModel):
    success: bool
    message: str
    status: str
