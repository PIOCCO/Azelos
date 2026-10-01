import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { apiRequest } from "../../api/client";
import { EntityListPage } from "./EntityListPage";
import type { NavItem } from "../../lib/nav";
import type { Column } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function OperationalListPage<T>({
  pageTitle,
  path,
  queryKey,
  moduleItem,
  columns,
  createLabel,
  buildCreateBody,
  extraCreateFields,
}: {
  pageTitle: string;
  path: string;
  queryKey: string;
  moduleItem: Pick<NavItem, "label" | "moduleKey">;
  columns: Column<T>[];
  createLabel: string;
  buildCreateBody: (name: string) => Record<string, unknown>;
  extraCreateFields?: ReactNode;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const createM = useMutation({
    mutationFn: () =>
      apiRequest(path, {
        method: "POST",
        body: JSON.stringify(buildCreateBody(name)),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setName("");
    },
  });

  return (
    <>
      <Card title={createLabel} className="mb-4">
        <form
          className="flex flex-wrap items-end gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate();
          }}
        >
          <label className="block min-w-[200px] flex-1">
            <span className="text-gray-600">Name</span>
            <input
              required
              className="mt-1 w-full rounded border px-2 py-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {extraCreateFields}
          <Button type="submit" disabled={createM.isPending || !name.trim()}>
            Create
          </Button>
        </form>
        {createM.error ? (
          <p className="mt-2 text-sm text-red-600">{(createM.error as Error).message}</p>
        ) : null}
      </Card>
      <EntityListPage<T>
        pageTitle={pageTitle}
        path={path}
        queryKey={queryKey}
        moduleItem={moduleItem}
        columns={columns}
        emptyDescription="Use the form above to register the first record."
      />
    </>
  );
}
