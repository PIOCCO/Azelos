import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Supplier } from "../../api/types";
import { createProvider } from "../../api/dora";
import { EntityListPage } from "./EntityListPage";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function ProvidersPage() {
  const qc = useQueryClient();
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("DE");
  const createM = useMutation({
    mutationFn: () => createProvider({ legal_name: legalName, country_code: country }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ict-providers"] });
      setLegalName("");
    },
  });

  return (
    <>
      <Card title="Add provider" className="mb-4">
        <form
          className="flex flex-wrap gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate();
          }}
        >
          <input
            required
            className="rounded border px-2 py-1"
            placeholder="Legal name"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
          <input
            required
            maxLength={2}
            className="w-16 rounded border px-2 py-1"
            placeholder="CC"
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
          />
          <Button type="submit" disabled={createM.isPending}>
            Create
          </Button>
        </form>
        {createM.error ? <p className="mt-2 text-sm text-red-600">{(createM.error as Error).message}</p> : null}
      </Card>
      <EntityListPage<Supplier>
      pageTitle="Third-Party Provider Portfolio"
      tableTitle="Providers"
      path="/api/v1/ict-providers"
      queryKey="ict-providers"
      moduleItem={{ label: "ICT Third-Party Providers", moduleKey: "THIRD_PARTY_RISK" }}
      emptyTitle="No ICT providers yet"
      emptyDescription="Use the form above to register your first ICT third-party provider."
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
    </>
  );
}
