import { NavLink } from "react-router-dom";
import { Home, Building2, Users, Newspaper, Mail } from "lucide-react";
import { useLocale } from "../lib/useLocale";

export default function MobileNav() {
  const { t } = useLocale();

  const items = [
    { to: "/", icon: Home, label: t("inst.nav.home"), end: true },
    { to: "/projets", icon: Building2, label: t("inst.nav.projects") },
    { to: "/membres", icon: Users, label: t("inst.nav.members") },
    { to: "/actualites", icon: Newspaper, label: t("inst.nav.news") },
    { to: "/contact", icon: Mail, label: t("inst.nav.contact") },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur-sm lg:hidden"
      aria-label={t("nav.home")}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition ${
                isActive ? "text-brand-700" : "text-ink-500"
              }`
            }
          >
            <Icon size={22} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
