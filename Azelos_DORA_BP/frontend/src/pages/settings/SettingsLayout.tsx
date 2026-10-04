import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { PageHeader } from "../../components/ui/PageHeader";
import { useTranslation } from "../../i18n/LocaleContext";

const ADMIN_LINKS = [
  { to: "/settings", end: true, labelKey: "settings.overview" },
  { to: "/settings/dora", end: false, labelKey: "settings.doraConfig" },
  { to: "/settings/access", end: false, labelKey: "settings.usersAccess" },
  { to: "/settings/integrations", end: false, labelKey: "settings.integrations" },
  { to: "/settings/cloud", end: false, labelKey: "settings.cloud" },
  { to: "/settings/custom-fields", end: false, labelKey: "settings.customFields" },
  { to: "/settings/license", end: false, labelKey: "settings.license" },
] as const;

export function SettingsLayout() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isAdmin = can(session?.role, "org.admin");
  const onLanguage = location.pathname.startsWith("/settings/language");

  if (!isAdmin && !onLanguage) {
    return <Navigate to="/settings/language" replace />;
  }

  const links = [
    { to: "/settings/language", end: false, labelKey: "settings.language" },
    ...(isAdmin ? ADMIN_LINKS : []),
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="shrink-0 lg:w-56">
        <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
        <nav className="mt-4 space-y-0.5 text-sm" aria-label={t("settings.sectionsNav")}>
          {links.map((l) => (
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
              {t(l.labelKey)}
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
