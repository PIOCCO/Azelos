from graphql import GraphQLError
from strawberry.extensions import SchemaExtension


class MaxQueryLengthExtension(SchemaExtension):
    def __init__(self, max_length: int = 8000) -> None:
        self.max_length = max_length

    def on_operation(self):
        query = self.execution_context.query
        if query and len(query) > self.max_length:
            raise GraphQLError(f"Query exceeds maximum length of {self.max_length} characters")
