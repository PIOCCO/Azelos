import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Consistent page title block for inner screens. */
export default function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="page-header">
      <div className="min-w-0 flex-1">
        <h1 className="page-title">{title}</h1>
        {description && <div className="page-description">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
