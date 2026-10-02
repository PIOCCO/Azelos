import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { PageHeader } from "../../components/ui/PageHeader";

const LINKS = [
  { to: "/settings", end: true, label: "Overview" },
  { to: "/settings/dora", end: false, label: "DORA configuration" },
  { to: "/settings/access", end: false, label: "Users & access" },
  { to: "/settings/integrations", end: false, label: "Integrations" },
  { to: "/settings/cloud", end: false, label: "Cloud environment" },
  { to: "/settings/custom-fields", end: false, label: "Custom fields" },
] as const;

export function SettingsLayout() {
  const { session } = useAuth();
  if (!can(session?.role, "org.admin")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="shrink-0 lg:w-56">
        <PageHeader
          title="Settings"
          subtitle="How this DORA platform operates for your organization."
        />
        <nav className="mt-4 space-y-0.5 text-sm" aria-label="Settings sections">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 font-medium ${
                  isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
