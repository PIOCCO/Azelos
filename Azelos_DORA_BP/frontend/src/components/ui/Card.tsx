import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={`rounded-lg border border-gray-200 bg-surface shadow-card ${className}`}
    >
      {title ? (
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={title ? "p-5" : "p-5"}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "primary" | "warning" | "danger";
}) {
  const valueClass = {
    default: "text-gray-900",
    primary: "text-primary",
    warning: "text-amber-600",
    danger: "text-red-600",
  }[tone];
  return (
    <div className="rounded-lg border border-gray-200 bg-surface px-5 py-4 shadow-card">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}
