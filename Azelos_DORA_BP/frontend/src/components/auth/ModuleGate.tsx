import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useModuleNav, useModuleNavMode, useOrg } from "../../contexts/OrgContext";
import { modulePageAccessAllowed } from "../../lib/moduleNav";
import { useTranslation } from "../../i18n/LocaleContext";
import type { NavItem } from "../../lib/nav";
import { EmptyState } from "../ui/States";

export function ModuleGate({
  item,
  children,
}: {
  item: Pick<NavItem, "moduleKey"> & { label: string; labelKey?: string };
  children: ReactNode;
}) {
  const modules = useModuleNav();
  const moduleNavMode = useModuleNavMode();
  const { applicability } = useOrg();
  const { t } = useTranslation();
  const displayLabel = item.labelKey ? t(item.labelKey) : item.label;
  const allowed = modulePageAccessAllowed(
    moduleNavMode,
    modules,
    item.moduleKey,
    applicability?.modules,
  );
  if (!allowed) {
    return (
      <EmptyState
        title={t("moduleGate.notAvailableTitle", { label: displayLabel })}
        description={t("moduleGate.notAvailableDescription")}
        action={
          <Link to="/onboarding/applicability" className="text-sm font-medium text-primary hover:underline">
            {t("moduleGate.viewApplicability")}
          </Link>
        }
      />
    );
  }
  return <>{children}</>;
}
