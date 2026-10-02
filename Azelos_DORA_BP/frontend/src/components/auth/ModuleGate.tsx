import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useModuleNav, useModuleNavMode, useOrg } from "../../contexts/OrgContext";
import { moduleAccessAllowed } from "../../lib/moduleNav";
import type { NavItem } from "../../lib/nav";
import { EmptyState } from "../ui/States";

export function ModuleGate({
  item,
  children,
}: {
  item: Pick<NavItem, "moduleKey" | "label">;
  children: ReactNode;
}) {
  const modules = useModuleNav();
  const moduleNavMode = useModuleNavMode();
  const { applicability } = useOrg();
  const allowed = moduleAccessAllowed(
    moduleNavMode,
    modules,
    item.moduleKey,
    applicability?.modules,
  );
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
