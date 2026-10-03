import type { ReactNode } from "react";
import { useTranslation } from "../../i18n/LocaleContext";
import { Button } from "./Button";

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  const { t } = useTranslation();
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label={t("common.loading")}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-md bg-gray-200" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-surface px-8 py-12 text-center">
      <p className="text-base font-medium text-gray-900">{title}</p>
      {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("errors.loadFailed");
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8" role="alert">
      <p className="font-medium text-red-900">{resolvedTitle}</p>
      {message ? <p className="mt-2 text-sm text-red-800">{message}</p> : null}
      {onRetry ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}
