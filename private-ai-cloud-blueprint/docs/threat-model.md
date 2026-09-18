# Threat model (summary)

| Threat | Mitigation |
|--------|------------|
| Unauthorized document access | Central ACL + pre-retrieval filter |
| Cross-tenant leakage | tenant_id on all queries |
| Prompt injection via documents | Separate system/user/retrieved channels; sanitize patterns |
| Credential theft | bcrypt, JWT expiry, no secrets in repo |
| Data exfil via external LLM | Default private Ollama; opt-in external only |
