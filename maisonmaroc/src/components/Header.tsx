import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User2 } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../lib/api";
import LanguageSwitcher from "./LanguageSwitcher";
import BrandLogo from "./BrandLogo";

export default function Header() {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/search", label: t("nav.properties") },
    { to: "/agents", label: t("nav.agents") },
    { to: "/favorites", label: t("nav.favorites") },
  ];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-bold transition ${
      isActive ? "text-brand-700" : "text-ink-600 hover:text-brand-700"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white text-ink-900 shadow-sm">
      <div className="border-b border-white/10 bg-navy-800/90">
        <div className="container-page flex h-9 items-center justify-end">
          <LanguageSwitcher variant="dark" />
        </div>
      </div>

      <div className="container-page flex min-h-[92px] items-center justify-between gap-4 py-2 sm:min-h-[104px] sm:py-3">
        <BrandLogo variant="header" />

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <NavLink
                to={dashboardPathForRole(user.role)}
                className="text-sm font-bold text-ink-700 hover:text-brand-700"
              >
                {user.name.split(" ")[0]}
              </NavLink>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="text-ink-400 hover:text-ink-700"
                aria-label={t("nav.logout")}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <NavLink
              to="/client/login"
              className="text-sm font-bold text-ink-700 hover:text-brand-700"
            >
              {t("nav.login")}
            </NavLink>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink-700 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white lg:hidden">
          <div className="container-page space-y-1 py-3">
            <div className="mb-3 px-1">
              <BrandLogo variant="compact" linkToHome={false} />
            </div>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-bold text-ink-700 hover:bg-ink-50"
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/publish"
              onClick={() => setOpen(false)}
              className="block rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-bold text-white"
            >
              {t("nav.publishShort")}
            </NavLink>
            <NavLink
              to={user ? dashboardPathForRole(user.role) : "/client/login"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-ink-600"
            >
              <User2 size={16} /> {user ? t("nav.account") : t("nav.login")}
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
