import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { SupplierWithEvidence } from "../../api/types";
import {
  EvidenceAttachmentsPanel,
  EvidencePdfColumnSubHeader,
} from "../../components/dora/EvidenceAttachmentsPanel";
import { createProvider } from "../../api/dora";
import { getApiBase, getTokenProvider } from "../../api/client";
import { EntityListPage } from "./EntityListPage";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function ProvidersPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("DE");
  const [importMsg, setImportMsg] = useState<string | null>(null);
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
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImportMsg(null);
              const fd = new FormData();
              fd.append("file", file);
              const token = getTokenProvider()();
              const res = await fetch(`${getApiBase()}/api/v1/import/ict-providers.csv`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: fd,
              });
              const body = await res.json().catch(() => ({}));
              if (!res.ok) {
                setImportMsg(typeof body?.error?.message === "string" ? body.error.message : "Import failed");
              } else {
                setImportMsg(`Imported ${body.created} provider(s).`);
                qc.invalidateQueries({ queryKey: ["ict-providers"] });
              }
              e.target.value = "";
            }}
          />
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            Import CSV
          </Button>
          <a
            className="text-primary hover:underline"
            href={`${getApiBase()}/api/v1/export/ict-providers.csv`}
            onClick={(ev) => {
              const token = getTokenProvider()();
              if (!token) return;
              ev.preventDefault();
              fetch(`${getApiBase()}/api/v1/export/ict-providers.csv`, {
                headers: { Authorization: `Bearer ${token}` },
              })
                .then((r) => r.text())
                .then((text) => {
                  const blob = new Blob([text], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "ict-providers.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                });
            }}
          >
            Export CSV
          </a>
          {importMsg ? <span className="text-gray-600">{importMsg}</span> : null}
        </div>
      </Card>
      <EntityListPage<SupplierWithEvidence>
      pageTitle="Third-Party Provider Portfolio"
      tableTitle="Providers"
      path="/api/v1/ict-providers"
      queryKey="ict-providers"
      searchable
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
        {
          key: "evidence",
          header: "Evidence (PDF)",
          subHeader: <EvidencePdfColumnSubHeader />,
          className: "min-w-[300px] align-top",
          render: (r) => (
            <EvidenceAttachmentsPanel
              entityType="ict_provider"
              entityId={r.id}
              initialFiles={r.evidence_files}
              invalidateQueryKeys={[["ict-providers"]]}
            />
          ),
        },
      ]}
    />
    </>
  );
}
