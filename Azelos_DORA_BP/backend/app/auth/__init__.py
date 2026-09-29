"""Authentication surface (implemented in app.core)."""

from app.core.dependencies import AuthContext, get_auth_context, get_current_user, require_role
from app.core.security import create_access_token, decode_access_token

__all__ = [
    "AuthContext",
    "get_auth_context",
    "get_current_user",
    "require_role",
    "create_access_token",
    "decode_access_token",
]
