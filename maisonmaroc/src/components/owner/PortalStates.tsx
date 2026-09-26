import { RefreshCw } from "lucide-react";
import { useLocale } from "../../lib/useLocale";

export function PortalLoading({ lines = 3 }: { lines?: number }) {
  const { t } = useLocale();
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{t("common.loading")}</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-ink-100" />
      ))}
    </div>
  );
}

export function PortalError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLocale();
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="mt-2 inline-flex items-center gap-1 font-semibold underline" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden /> {t("ownerPortal.retry")}
        </button>
      )}
    </div>
  );
}

export function PortalEmpty({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-stone-50 px-6 py-10 text-center">
      <p className="text-sm text-ink-600">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn-primary mt-4" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function PortalSuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
      {message}
    </div>
  );
}
