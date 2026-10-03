import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useOrg } from "../../contexts/OrgContext";
import { ErrorState } from "../ui/States";
import { useTranslation } from "../../i18n/LocaleContext";

export function AppLayout() {
  const { t } = useTranslation();
  const { error } = useOrg();

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-canvas">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-6 lg:p-8">
          {error ? (
            <div className="mb-4">
              <ErrorState title={t("errors.orgContext")} message={error.message} />
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
