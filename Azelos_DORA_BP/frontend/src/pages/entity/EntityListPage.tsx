import type { ReactNode } from "react";
import { useState } from "react";
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
  searchable,
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
  searchable?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { data, page, setPage, isLoading, error, refetch } = usePaginatedResource<T>(
    queryKey,
    path,
    20,
    { search: searchable ? search : undefined },
  );

  const searchToolbar = searchable ? (
    <form
      className="flex gap-2 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput);
      }}
    >
      <input
        className="min-w-[180px] rounded border px-2 py-1"
        placeholder="Search…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      <button type="submit" className="rounded border px-3 py-1 hover:bg-gray-50">
        Filter
      </button>
    </form>
  ) : null;

  return (
    <ModuleGate item={moduleItem}>
      <PageHeader title={pageTitle} actions={actions} />
      <DataTable
        title={tableTitle ?? pageTitle}
        toolbar={
          toolbar || searchToolbar ? (
            <div className="flex flex-wrap items-center gap-3">
              {searchToolbar}
              {toolbar}
            </div>
          ) : undefined
        }
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
