# Audit log

Stored in `audit_logs` with:

- who (`user_id`)
- tenant (`tenant_id`)
- action (`AuditAction` enum)
- resource (`resource_id` when applicable)
- previous_state / new_state (for approvals and status changes)
- result
- request_id (from `X-Request-ID` middleware)
- timestamp

Actions include login, sync lifecycle, recommendation approve/execute, alert acknowledge/resolve, report generation.

Logs are append-only by convention; no UI delete in MVP.
