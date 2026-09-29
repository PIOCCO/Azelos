from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=200)


class PaginatedResponse(BaseModel):
    items: list
    page: int
    page_size: int
    total: int
