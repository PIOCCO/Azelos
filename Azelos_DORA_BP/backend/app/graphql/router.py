from fastapi import Depends, Request
from sqlalchemy.orm import Session
from strawberry.fastapi import GraphQLRouter

from app.core.database import get_db
from app.graphql.auth import auth_from_request
from app.graphql.context import GraphQLContext
from app.graphql.schema import build_schema


def create_graphql_router() -> GraphQLRouter:
    schema = build_schema(introspection_enabled=True)

    async def context_getter(
        request: Request,
        db: Session = Depends(get_db),
    ) -> GraphQLContext:
        return GraphQLContext(db=db, auth=auth_from_request(request, db))

    return GraphQLRouter(schema, context_getter=context_getter)
