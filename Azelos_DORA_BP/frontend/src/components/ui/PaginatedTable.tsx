import type { ReactNode } from "react";
import type { Paginated } from "../../api/types";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export function PaginatedTable<T>({
  data,
  columns,
  page,
  onPageChange,
  isLoading,
}: {
  data: Paginated<T> | undefined;
  columns: Column<T>[];
  page: number;
  onPageChange: (p: number) => void;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <p className="text-slate-600">Loading…</p>;
  }
  if (!data) return null;
  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.items.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-slate-500">
                No records.
              </td>
            </tr>
          ) : (
            data.items.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2">
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-sm text-slate-600">
        <span>
          Page {data.page} of {totalPages} ({data.total} total)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded border px-2 py-1 disabled:opacity-40"
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            className="rounded border px-2 py-1 disabled:opacity-40"
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
