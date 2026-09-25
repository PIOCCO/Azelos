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
    { to: "/a-propos", label: t("inst.nav.about") },
    { to: "/membres", label: t("inst.nav.members") },
    { to: "/projets", label: t("inst.nav.projects") },
    { to: "/actualites", label: t("inst.nav.news") },
    { to: "/contact", label: t("inst.nav.contact") },
  ];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? "nav-link-active" : ""}`;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white text-ink-900 shadow-sm">
      <div className="border-b border-white/10 bg-navy-800/90">
        <div className="container-page flex h-9 items-center justify-end">
          <LanguageSwitcher variant="dark" />
        </div>
      </div>

      <div className="container-page flex min-h-[100px] items-center justify-between gap-4 py-2 sm:min-h-[116px] sm:py-3">
        <BrandLogo variant="header" />

        <nav className="hidden items-center gap-1 xl:flex" aria-label={t("nav.home")}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <NavLink to={dashboardPathForRole(user.role)} className="nav-link">
                {user.name.split(" ")[0]}
              </NavLink>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="grid h-10 w-10 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                aria-label={t("nav.logout")}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <NavLink to="/owner/login" className="btn-outline btn-sm">
              {t("inst.nav.promoterLogin")}
            </NavLink>
          )}
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-xl text-ink-700 hover:bg-ink-50 xl:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white xl:hidden">
          <nav className="container-page space-y-1 py-3">
            <NavLink
              to="/"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-3 text-sm font-bold ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-ink-50"
                }`
              }
            >
              {t("inst.nav.home")}
            </NavLink>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-3 text-sm font-bold ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-ink-50"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/evenements"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-sm font-bold text-ink-700 hover:bg-ink-50"
            >
              {t("inst.nav.events")}
            </NavLink>
            <NavLink
              to="/documents"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-sm font-bold text-ink-700 hover:bg-ink-50"
            >
              {t("inst.nav.documents")}
            </NavLink>
            <NavLink
              to={user ? dashboardPathForRole(user.role) : "/owner/login"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-ink-700 hover:bg-ink-50"
            >
              <User2 size={16} /> {user ? t("nav.account") : t("inst.nav.promoterLogin")}
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}
