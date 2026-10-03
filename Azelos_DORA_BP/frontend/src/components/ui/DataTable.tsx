import type { ReactNode } from "react";
import type { Paginated } from "../../api/types";
import { useTranslation } from "../../i18n/LocaleContext";
import { EmptyState } from "./States";
import { LoadingSkeleton } from "./States";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Optional sub-header row content (e.g. Evidence / Actions labels). */
  subHeader?: ReactNode;
}

export function DataTable<T>({
  title,
  toolbar,
  columns,
  data,
  page,
  onPageChange,
  isLoading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
}: {
  title?: string;
  toolbar?: ReactNode;
  columns: Column<T>[];
  data: Paginated<T> | undefined;
  page: number;
  onPageChange: (p: number) => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { t } = useTranslation();
  const resolvedEmptyTitle = emptyTitle ?? t("common.noRecords");
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-surface shadow-card p-5">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-surface shadow-card p-5">
        <p className="text-sm text-red-700">{error.message}</p>
        {onRetry ? (
          <button type="button" className="mt-2 text-sm text-primary underline" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
      {(title || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {title ? <h2 className="text-base font-semibold text-gray-900">{title}</h2> : <span />}
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={`px-5 py-3 align-bottom ${c.className ?? ""}`}>
                  <div>{c.header}</div>
                  {c.subHeader ? <div className="mt-1">{c.subHeader}</div> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!data || data.items.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState title={resolvedEmptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.items.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/80">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-5 py-3.5 text-gray-800 ${c.className ?? ""}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data && data.items.length > 0 ? (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-600">
          <span>
            {t("common.pageOfTotal", {
              page: data.page,
              totalPages,
              total: data.total,
            })}
          </span>
          <nav className="flex gap-1" aria-label="Pagination">
            <PaginationBtn disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              {t("common.previous")}
            </PaginationBtn>
            <PaginationBtn disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              {t("common.next")}
            </PaginationBtn>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function PaginationBtn({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}
