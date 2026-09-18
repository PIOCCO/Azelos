# Security

- JWT auth, bcrypt passwords, RBAC + department + document ACLs
- Retrieved document text treated as **untrusted** (prompt injection mitigation)
- No external LLM by default (`LLM_PROVIDER=ollama` on private network)
- Secrets via environment — never in Git
- Audit log for auth, documents, permissions, AI queries (metadata only)
- TLS at proxy; internal DB/storage on private Docker network

See threat model in `docs/threat-model.md`.
