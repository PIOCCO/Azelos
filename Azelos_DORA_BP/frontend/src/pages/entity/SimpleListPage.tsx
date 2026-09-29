import type { ReactNode } from "react";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { PaginatedTable } from "../../components/ui/PaginatedTable";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";
import type { NavItem } from "../../lib/nav";

export function SimpleListPage<T>({
  title,
  path,
  queryKey,
  moduleItem,
  columns,
  headerNote,
}: {
  title: string;
  path: string;
  queryKey: string;
  moduleItem: Pick<NavItem, "label" | "moduleKey">;
  columns: { key: string; header: string; render: (row: T) => ReactNode }[];
  headerNote?: string;
}) {
  const { data, page, setPage, isLoading } = usePaginatedResource<T>(queryKey, path);

  return (
    <ModuleGate item={moduleItem}>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {headerNote ? <p className="mt-1 text-sm text-slate-600">{headerNote}</p> : null}
      <div className="mt-4">
        <PaginatedTable
          data={data}
          page={page}
          onPageChange={setPage}
          isLoading={isLoading}
          columns={columns}
        />
      </div>
    </ModuleGate>
  );
}
