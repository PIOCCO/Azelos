from pydantic import BaseModel, Field


class PolicyStatusItem(BaseModel):
    key: str
    version: str
    title_en: str
    title_fr: str
    accepted: bool


class PolicyStatusOut(BaseModel):
    app_version: str
    all_accepted: bool
    missing_policy_keys: list[str]
    policies: list[PolicyStatusItem]


class PolicyAcceptOut(BaseModel):
    all_accepted: bool
    recorded_count: int


class PolicyDocumentOut(BaseModel):
    key: str
    version: str
    locale: str
    title: str
    content_markdown: str


class PolicyAcceptIn(BaseModel):
    confirm: bool = Field(..., description="Must be true to record acceptance")
