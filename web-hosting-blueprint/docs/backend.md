# Backend module

Set `backend.framework`, port, and `health_endpoint` (minimum liveness; extend with dependency checks in app code).

Examples: `backend/examples/{node,python,go,php}`.

Backends listen on internal Docker network; public access via proxy + `domains.backend`.
