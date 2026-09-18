# Reporting

## Monthly report

- Generated via `GET /api/v1/reports/monthly`
- Formats: JSON (default), `markdown`, `pdf`
- PDF uses Atlas Azure Resilience cover metadata: customer, period, report ID
- Sections: executive summary, infrastructure, risks (expand over time)

Customer-facing exports avoid internal engineering terms where possible.
