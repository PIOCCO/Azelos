"""Shared PostgreSQL ENUM helpers (persist enum .value, not member name)."""

from enum import Enum
from typing import TypeVar

from sqlalchemy.dialects.postgresql import ENUM

E = TypeVar("E", bound=Enum)


def pg_enum(enum_class: type[E], name: str, *, create_type: bool = True) -> ENUM:
    return ENUM(
        enum_class,
        name=name,
        values_callable=lambda members: [m.value for m in members],
        create_type=create_type,
    )
