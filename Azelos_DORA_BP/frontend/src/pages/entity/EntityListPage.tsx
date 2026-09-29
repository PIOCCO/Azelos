import type { ReactNode } from "react";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";
import type { NavItem } from "../../lib/nav";

export function EntityListPage<T>({
  pageTitle,
  tableTitle,
  path,
  queryKey,
  moduleItem,
  columns,
  actions,
  toolbar,
  emptyTitle,
  emptyDescription,
}: {
  pageTitle: string;
  tableTitle?: string;
  path: string;
  queryKey: string;
  moduleItem: Pick<NavItem, "label" | "moduleKey">;
  columns: Column<T>[];
  actions?: ReactNode;
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { data, page, setPage, isLoading, error, refetch } = usePaginatedResource<T>(queryKey, path);

  return (
    <ModuleGate item={moduleItem}>
      <PageHeader title={pageTitle} actions={actions} />
      <DataTable
        title={tableTitle ?? pageTitle}
        toolbar={toolbar}
        columns={columns}
        data={data}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </ModuleGate>
  );
}
