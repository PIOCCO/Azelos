import type { ReactNode } from "react";

export function LoadingPanel({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
      {label}
    </div>
  );
}

export function ErrorPanel({
  title = "Something went wrong",
  message,
  children,
}: {
  title?: string;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
      <p className="font-semibold">{title}</p>
      {message ? <p className="mt-2 text-sm">{message}</p> : null}
      {children}
    </div>
  );
}

export function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
      {message}
    </div>
  );
}
