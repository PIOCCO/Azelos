from dataclasses import dataclass

from sqlalchemy.orm import Session
from strawberry.fastapi import BaseContext

from app.core.dependencies import AuthContext


@dataclass
class GraphQLContext(BaseContext):
    db: Session
    auth: AuthContext | None = None
