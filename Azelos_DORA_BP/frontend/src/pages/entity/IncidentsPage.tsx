import { Link } from "react-router-dom";
import type { ICTIncident } from "../../api/types";
import { EntityListPage } from "./EntityListPage";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";

export function IncidentsPage() {
  return (
    <EntityListPage<ICTIncident>
      pageTitle="ICT Incidents"
      tableTitle="Incidents"
      path="/api/v1/incidents"
      queryKey="incidents"
      moduleItem={{ label: "Incidents", moduleKey: "INCIDENT_MANAGEMENT" }}
      emptyTitle="No incidents recorded"
      emptyDescription="Create an incident to track detection through post-incident review."
      columns={[
        {
          key: "title",
          header: "Title",
          render: (r) => (
            <Link to={`/incidents/${r.id}`} className="font-medium text-primary hover:underline">
              {r.title}
            </Link>
          ),
        },
        {
          key: "severity",
          header: "Severity",
          render: (r) => (
            <StatusBadge tone={toneFromLevel(r.severity)}>{r.severity}</StatusBadge>
          ),
        },
        { key: "status", header: "Status", render: (r) => r.status },
        {
          key: "major",
          header: "Major",
          render: (r) => (r.is_major ? "Yes" : "—"),
        },
      ]}
    />
  );
}
