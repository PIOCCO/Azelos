from pydantic import BaseModel, EmailStr

from app.models.entities import AlertSeverity, RecommendationStatus, UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    tenant_id: str | None


class TenantOut(BaseModel):
    id: str
    name: str
    azure_subscription_id: str | None

    class Config:
        from_attributes = True


class ResourceOut(BaseModel):
    id: str
    name: str
    resource_type: str
    resource_group: str
    health_status: str
    backup_protected: bool | None
    monthly_cost_usd: float | None

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: str
    title: str
    problem: str
    evidence: str
    suggested_action: str
    estimated_savings_usd: float | None
    priority: str
    risk: str
    status: RecommendationStatus

    class Config:
        from_attributes = True
