"""Integration connection types and lifecycle status."""

import enum


class IntegrationType(str, enum.Enum):
    POSTGRESQL = "postgresql"
    HTTP_API = "http_api"


class IntegrationStatus(str, enum.Enum):
    NOT_CONFIGURED = "not_configured"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    CONNECTION_FAILED = "connection_failed"
    DISABLED = "disabled"
