export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="state-box muted">{label}</div>;
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="state-box">
      <strong>{title}</strong>
      {detail && <p className="muted">{detail}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-box bad">
      <strong>Something went wrong</strong>
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
