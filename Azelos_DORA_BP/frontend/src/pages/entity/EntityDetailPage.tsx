import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { LoadingSkeleton, ErrorState } from "../../components/ui/States";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";

export function EntityDetailPage({
  backTo,
  backLabel,
  title,
  badges,
  isLoading,
  error,
  onRetry,
  fields,
}: {
  backTo: string;
  backLabel: string;
  title: string;
  badges?: { label: string; tone?: "critical" | "high" | "medium" | "low" | "success" | "neutral" }[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  fields: { label: string; value: string }[];
}) {
  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;

  return (
    <div>
      <Link to={backTo} className="text-sm font-medium text-primary hover:underline">
        ← {backLabel}
      </Link>
      <PageHeader
        title={title}
        actions={
          badges?.length ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <StatusBadge key={b.label} tone={b.tone ?? toneFromLevel(b.label)}>
                  {b.label}
                </StatusBadge>
              ))}
            </div>
          ) : null
        }
      />
      <Card title="Overview">
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{f.label}</dt>
              <dd className="mt-1 text-sm text-gray-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
