# FinOps (customer financial visibility)

## Data sources

| Source | Implementation |
|--------|----------------|
| Month-to-date spend | `CostSnapshot` + Azure Cost Management API on sync |
| Daily trends | `CostDailyRecord` |
| By service | `CostServiceRecord` |
| By resource | `AzureResource.monthly_cost_usd` + Resource Graph linkage |
| Budget | `TenantSettings.monthly_budget_usd` / snapshot |
| Forecast | Azure Cost Management (when available) |
| Anomalies | `CostAnomalyRecord` (demo + alert engine) |
| Savings | `Recommendation` (FINOPS category) |

## Budget alerts

Provider/customer alerts include cost anomalies and budget thresholds (via alert evaluation during sync).

## Limitations

- Live Azure queries run at **sync time**, not per page view.
- Forecast requires Cost Management API permissions and may be unavailable (`forecast_available: false`).
- Service names in demo data are illustrative; live data uses Azure meter categories.

## Empty vs zero

API returns `data_available: false` when no sync has populated cost tables — UI must not show `$0` as if that were confirmed spend.
