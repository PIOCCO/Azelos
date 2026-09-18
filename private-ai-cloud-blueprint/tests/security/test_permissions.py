import os

os.environ["APP_ENV"] = "test"
os.environ["LLM_MOCK"] = "true"

from app.models.entities import Role, User
from app.services.permissions import get_accessible_document_ids


class FakeDB:
    def __init__(self, perms, docs):
        self.perms = perms
        self.docs = docs

    def scalars(self, stmt):
        class R:
            def __init__(self, items):
                self.items = items

            def all(self):
                return self.items

        # Very small stub — real tests use integration DB
        return R([])


def test_admin_role_enum():
    assert Role.ADMIN.value == "ADMIN"
