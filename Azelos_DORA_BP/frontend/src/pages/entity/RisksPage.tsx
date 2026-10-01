import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Risk, Supplier } from "../../api/types";
import { fetchPaginated } from "../../api/dora";
import { apiRequest } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EntityListPage } from "./EntityListPage";

const DIMENSIONS = [
  "criticality",
  "data_sensitivity",
  "substitutability",
  "concentration_risk",
  "geographic_risk",
  "security_assurance",
  "contract_gaps",
  "exit_feasibility",
] as const;

const LEVELS = ["very_low", "low", "medium", "high", "very_high"] as const;

export function RisksPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [providerId, setProviderId] = useState("");
  const [title, setTitle] = useState("");
  const [levels, setLevels] = useState<Record<(typeof DIMENSIONS)[number], string>>(() =>
    Object.fromEntries(DIMENSIONS.map((d) => [d, "medium"])) as Record<
      (typeof DIMENSIONS)[number],
      string
    >,
  );

  const providersQ = useQuery({
    queryKey: ["ict-providers", "risk-form"],
    queryFn: () => fetchPaginated<Supplier>("/api/v1/ict-providers", 1, 100),
  });

  const createM = useMutation({
    mutationFn: () =>
      apiRequest<Risk>("/api/v1/risks", {
        method: "POST",
        body: JSON.stringify({
          provider_id: providerId,
          title: title || null,
          assessor: session?.email ?? "unknown",
          ...levels,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risks"] });
      setTitle("");
    },
  });

  return (
    <>
      <Card title="New risk assessment" className="mb-4">
        <form
          className="grid gap-3 text-sm md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate();
          }}
        >
          <label className="block md:col-span-2">
            <span className="text-gray-600">Linked provider</span>
            <select
              required
              className="mt-1 w-full rounded border px-2 py-1"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              <option value="">Select provider…</option>
              {(providersQ.data?.items ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.legal_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-gray-600">Title (optional)</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          {DIMENSIONS.map((dim) => (
            <label key={dim} className="block">
              <span className="text-gray-600">{dim.replace(/_/g, " ")}</span>
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                value={levels[dim]}
                onChange={(e) => setLevels((prev) => ({ ...prev, [dim]: e.target.value }))}
              >
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="md:col-span-2">
            <Button type="submit" disabled={createM.isPending || !providerId}>
              Create assessment
            </Button>
            {createM.error ? (
              <p className="mt-2 text-red-600">{(createM.error as Error).message}</p>
            ) : null}
          </div>
        </form>
      </Card>
      <EntityListPage<Risk>
        pageTitle="ICT Risk Register"
        tableTitle="ICT Risks"
        path="/api/v1/risks"
        queryKey="risks"
        searchable
        moduleItem={{ label: "ICT Risk Management", moduleKey: "ICT_RISK" }}
        emptyTitle="No risk assessments yet"
        emptyDescription="Use the form above to register an assessment against a provider."
        columns={[
          {
            key: "title",
            header: "Title",
            render: (r) => (
              <Link to={`/risks/${r.id}`} className="font-medium text-primary hover:underline">
                {r.title ?? r.id.slice(0, 8).toUpperCase()}
              </Link>
            ),
          },
          {
            key: "level",
            header: "Resulting level",
            render: (r) => (
              <StatusBadge tone={toneFromLevel(r.resulting_risk_level)}>
                {r.resulting_risk_level}
              </StatusBadge>
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
    </>
  );
}
