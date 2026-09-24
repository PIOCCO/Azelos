import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="empty-state" role="status">
      <div className="mb-4 text-ink-300">{icon}</div>
      <p className="text-lg font-bold text-ink-900">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
