import uuid
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    organization_id: uuid.UUID | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    organization_id: uuid.UUID
    role: str


class OidcTokenRequest(BaseModel):
    id_token: str
    organization_id: uuid.UUID | None = None


class LoginOptionsOut(BaseModel):
    oidc_enabled: bool
    oidc_client_id: str | None = None
    oidc_issuer_url: str | None = None
