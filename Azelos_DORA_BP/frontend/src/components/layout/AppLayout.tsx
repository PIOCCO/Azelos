import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useOrg } from "../../contexts/OrgContext";
import { ErrorState } from "../ui/States";

export function AppLayout() {
  const { error } = useOrg();

  return (
    <div className="flex min-h-screen bg-surface-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {error ? (
            <div className="mb-4">
              <ErrorState title="Organization context" message={error.message} />
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
