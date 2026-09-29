import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useModuleNav, useOrg } from "../../contexts/OrgContext";
import { can } from "../../lib/permissions";
import { ADMIN_NAV, CORE_NAV, MODULE_NAV, filterNav } from "../../lib/nav";

export function AppLayout() {
  const { session, logout } = useAuth();
  const { isLoading, error } = useOrg();
  const modules = useModuleNav();
  const location = useLocation();
  const showAdmin = can(session?.role, "org.admin");

  const moduleItems = filterNav(MODULE_NAV, modules);

  const linkClass = (path: string) =>
    `block rounded px-3 py-1.5 text-sm ${
      location.pathname === path || location.pathname.startsWith(`${path}/`)
        ? "bg-slate-800 text-white"
        : "text-slate-700 hover:bg-slate-200"
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-100 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Azelos DORA
        </p>
        <p className="mb-4 truncate text-sm text-slate-600">{session?.email}</p>
        <nav className="space-y-4">
          <div>
            <p className="mb-1 px-3 text-xs font-medium text-slate-500">Core</p>
            {CORE_NAV.map((item) => (
              <Link key={item.path} to={item.path} className={linkClass(item.path)}>
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <p className="mb-1 px-3 text-xs font-medium text-slate-500">Modules</p>
            {isLoading ? (
              <p className="px-3 text-xs text-slate-500">Loading modules…</p>
            ) : (
              moduleItems.map((item) => (
                <Link key={item.path} to={item.path} className={linkClass(item.path)}>
                  {item.label}
                  {item.stub ? " (preview)" : ""}
                </Link>
              ))
            )}
          </div>
          {showAdmin ? (
            <div>
              <p className="mb-1 px-3 text-xs font-medium text-slate-500">Configuration</p>
              {ADMIN_NAV.map((item) => (
                <Link key={item.path} to={item.path} className={linkClass(item.path)}>
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </nav>
        <button
          type="button"
          className="mt-6 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          onClick={() => logout()}
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-6">
        {error ? (
          <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Organization data: {error.message}
          </p>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
