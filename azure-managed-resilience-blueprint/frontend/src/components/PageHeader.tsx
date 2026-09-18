export function PageHeader({ title, breadcrumb }: { title: string; breadcrumb?: string }) {
  return (
    <header className="page-header">
      {breadcrumb && <p className="breadcrumb muted">{breadcrumb}</p>}
      <h2>{title}</h2>
    </header>
  );
}
