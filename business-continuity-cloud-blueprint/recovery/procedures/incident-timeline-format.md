# Incident timeline format

Timelines are JSON files under `reports/incidents/<incident_id>/timeline.json`.

```json
{
  "incident_id": "restore-20260101T120000Z",
  "timezone": "UTC",
  "started_at_utc": "2026-01-01T12:00:00+00:00",
  "events": [
    {
      "offset": "T+00",
      "label": "Recovery initiated",
      "detail": "Recovery point: latest",
      "timestamp_utc": "2026-01-01T12:00:00+00:00"
    }
  ]
}
```

Display local time only in client-facing reports; store UTC internally.
