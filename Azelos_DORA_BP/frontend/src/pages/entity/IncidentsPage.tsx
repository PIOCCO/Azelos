import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ICTIncident } from "../../api/types";
import { apiRequest } from "../../api/client";
import { EntityListPage } from "./EntityListPage";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function IncidentsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("medium");
  const createM = useMutation({
    mutationFn: () =>
      apiRequest<ICTIncident>("/api/v1/incidents", {
        method: "POST",
        body: JSON.stringify({ title, severity, is_major: false }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      setTitle("");
    },
  });

  return (
    <>
      <Card title="Register incident" className="mb-4">
        <form
          className="flex flex-wrap gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate();
          }}
        >
          <input
            required
            className="min-w-[200px] flex-1 rounded border px-2 py-1"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="rounded border px-2 py-1"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <Button type="submit" disabled={createM.isPending}>
            Create
          </Button>
        </form>
        {createM.error ? <p className="mt-2 text-sm text-red-600">{(createM.error as Error).message}</p> : null}
      </Card>
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
    </>
  );
}
