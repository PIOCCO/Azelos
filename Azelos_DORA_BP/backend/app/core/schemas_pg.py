"""PostgreSQL schema names (logical separation)."""

import os

DORA_CORE_SCHEMA = os.getenv("DORA_CORE_SCHEMA", "public")
DORA_CONFIG_SCHEMA = os.getenv("DORA_CONFIG_SCHEMA", "public")
CLIENT_EXTENSIONS_SCHEMA = os.getenv("CLIENT_EXTENSIONS_SCHEMA", "client_extensions")
