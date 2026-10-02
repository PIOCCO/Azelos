from pydantic import BaseModel, Field


class NodePosition(BaseModel):
    x: float
    y: float


class RelationshipMapLayoutOut(BaseModel):
    positions: dict[str, NodePosition] = Field(default_factory=dict)


class RelationshipMapLayoutUpdate(BaseModel):
    positions: dict[str, NodePosition] = Field(default_factory=dict)
