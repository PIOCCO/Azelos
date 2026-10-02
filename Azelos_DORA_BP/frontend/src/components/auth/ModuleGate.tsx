import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useModuleNav, useModuleNavMode } from "../../contexts/OrgContext";
import { moduleAllowsAccess, type NavItem } from "../../lib/nav";
import { EmptyState, LoadingSkeleton } from "../ui/States";

export function ModuleGate({
  item,
  children,
}: {
  item: Pick<NavItem, "moduleKey" | "label">;
  children: ReactNode;
}) {
  const modules = useModuleNav();
  const moduleNavMode = useModuleNavMode();
  if (moduleNavMode === "pending") {
    return <LoadingSkeleton rows={4} />;
  }
  const allowed =
    moduleNavMode === "error" ? true : moduleAllowsAccess(modules, item.moduleKey);
  if (!allowed) {
    return (
      <EmptyState
        title={`${item.label} is not available`}
        description="This module is disabled or not applicable for your organization. Review applicability or module configuration."
        action={
          <Link to="/onboarding/applicability" className="text-sm font-medium text-primary hover:underline">
            View applicability
          </Link>
        }
      />
    );
  }
  return <>{children}</>;
}
