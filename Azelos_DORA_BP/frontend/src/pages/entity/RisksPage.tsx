import { Link } from "react-router-dom";
import type { Risk } from "../../api/types";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";
import { EntityListPage } from "./EntityListPage";

export function RisksPage() {
  return (
    <EntityListPage<Risk>
      pageTitle="ICT Risk Register"
      tableTitle="ICT Risks"
      path="/api/v1/risks"
      queryKey="risks"
      moduleItem={{ label: "ICT Risk Management", moduleKey: "ICT_RISK" }}
      emptyTitle="No risk assessments yet"
      emptyDescription="Create assessments via API when your role allows."
      columns={[
        {
          key: "id",
          header: "Risk ID",
          render: (r) => (
            <Link to={`/risks/${r.id}`} className="font-medium text-primary hover:underline">
              {r.id.slice(0, 8).toUpperCase()}
            </Link>
          ),
        },
        {
          key: "level",
          header: "Resulting level",
          render: (r) => (
            <StatusBadge tone={toneFromLevel(r.resulting_risk_level)}>{r.resulting_risk_level}</StatusBadge>
          ),
        },
        { key: "assessor", header: "Assessor", render: (r) => r.assessor },
        {
          key: "at",
          header: "Calculated",
          render: (r) => new Date(r.calculated_at).toLocaleString(),
        },
      ]}
    />
  );
}
