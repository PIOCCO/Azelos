import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useModuleNav } from "../../contexts/OrgContext";
import { moduleAllowsAccess, type NavItem } from "../../lib/nav";
import { EmptyPanel } from "../ui/StatePanel";

export function ModuleGate({
  item,
  children,
}: {
  item: Pick<NavItem, "moduleKey" | "label">;
  children: ReactNode;
}) {
  const modules = useModuleNav();
  const allowed = moduleAllowsAccess(modules, item.moduleKey);
  if (!allowed) {
    return (
      <EmptyPanel
        message={`${item.label} is not enabled or not applicable for your organization profile. Review applicability or module configuration.`}
      />
    );
  }
  return (
    <>
      {children}
      <p className="mt-4 text-xs text-slate-500">
        <Link to="/onboarding/applicability" className="underline">
          View applicability
        </Link>
      </p>
    </>
  );
}
