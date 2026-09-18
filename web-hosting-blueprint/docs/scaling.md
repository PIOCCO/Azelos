# Scaling profiles

| Profile | Typical layout |
|---------|----------------|
| small | 1 VPS, Compose stack |
| standard | VM + managed DB option + Redis + backup timer |
| resilient | Load balancer, ≥2 app instances, managed PostgreSQL, secondary recovery (manual/Terraform extension) |

Scale by increasing `resources.*` limits and upgrading VM SKU — no cluster required for first growth stage.
