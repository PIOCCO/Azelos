import { Link } from "react-router-dom";
import type { Supplier } from "../../api/types";
import { EntityListPage } from "./EntityListPage";

export function ProvidersPage() {
  return (
    <EntityListPage<Supplier>
      pageTitle="Third-Party Provider Portfolio"
      tableTitle="Providers"
      path="/api/v1/ict-providers"
      queryKey="ict-providers"
      moduleItem={{ label: "ICT Third-Party Providers", moduleKey: "THIRD_PARTY_RISK" }}
      emptyTitle="No ICT providers yet"
      emptyDescription="Add providers through the API or future create flow."
      columns={[
        {
          key: "name",
          header: "Provider name",
          render: (r) => (
            <Link to={`/ict-providers/${r.id}`} className="font-medium text-primary hover:underline">
              {r.legal_name}
            </Link>
          ),
        },
        { key: "country", header: "Country", render: (r) => r.country_code },
        { key: "lei", header: "LEI", render: (r) => r.lei ?? "—" },
        { key: "trade", header: "Trading name", render: (r) => r.trading_name ?? "—" },
      ]}
    />
  );
}
