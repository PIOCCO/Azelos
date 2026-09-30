import type { ReactNode } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";

interface Props<T extends { id: string }> {
  title: string;
  path: string;
  queryKey: string;
  columns: { key: string; header: string; render: (r: T) => ReactNode }[];
}

export function SimpleResilienceListPage<T extends { id: string }>({
  title,
  path,
  queryKey,
  columns,
}: Props<T>) {
  const { data, page, setPage, isLoading, error, refetch } = usePaginatedResource<T>(queryKey, path);
  return (
    <div>
      <PageHeader title={title} />
      <DataTable
        columns={columns}
        data={data}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}
