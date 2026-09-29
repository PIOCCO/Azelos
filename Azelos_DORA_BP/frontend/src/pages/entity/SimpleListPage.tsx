import { EntityListPage } from "./EntityListPage";
import type { NavItem } from "../../lib/nav";
import type { Column } from "../../components/ui/DataTable";

/** @deprecated Prefer EntityListPage directly */
export function SimpleListPage<T>({
  title,
  path,
  queryKey,
  moduleItem,
  columns,
  headerNote,
}: {
  title: string;
  path: string;
  queryKey: string;
  moduleItem: Pick<NavItem, "label" | "moduleKey">;
  columns: Column<T>[];
  headerNote?: string;
}) {
  return (
    <EntityListPage<T>
      pageTitle={title}
      path={path}
      queryKey={queryKey}
      moduleItem={moduleItem}
      columns={columns}
      emptyDescription={headerNote}
    />
  );
}
