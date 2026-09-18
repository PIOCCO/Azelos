# Gap assessment

```bash
SOC2BP_MOCK_MODE=true ./scripts/run-assessment.sh
```

Output: `gap-analysis.json` with per-control status:

- `PASS` — implemented and operating (in mock/local checks)
- `WARNING` — implemented but operating/evidence incomplete
- `GAP` — not implemented
- `MANUAL` — requires human evidence

Exit code `1` when `GAP` exists — expected during early readiness.
