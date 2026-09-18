# Cost

Variable costs: GPU inference, embedding compute, object storage, PostgreSQL.

Use `dev` profile with `LLM_MOCK=true` for zero GPU cost.

`small` profile: single modest GPU or CPU-small model for pilots.

Scale inference with queue workers — do not keep large GPUs running 24/7 unless required.
