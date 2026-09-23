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
      isActive ? "text-white" : "text-white/75 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
      <div className="border-b border-white/10 bg-navy-800/80">
        <div className="container-page flex h-9 items-center justify-end">
          <LanguageSwitcher variant="dark" />
        </div>
      </div>

      <div className="container-page flex h-[64px] items-center justify-between gap-4">
        <BrandLogo variant="header" showTagline />

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <NavLink
            to="/publish"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500"
          >
            {t("nav.publishShort")}
          </NavLink>
          {user ? (
            <>
              <NavLink
                to={dashboardPathForRole(user.role)}
                className="text-sm font-bold text-white/90 hover:text-white"
              >
                {user.name.split(" ")[0]}
              </NavLink>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="text-white/60 hover:text-white"
                aria-label={t("nav.logout")}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <NavLink
              to="/client/login"
              className="text-sm font-bold text-white/90 hover:text-white"
            >
              {t("nav.login")}
            </NavLink>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-navy lg:hidden">
          <div className="container-page space-y-1 py-3">
            <div className="mb-3 px-1">
              <BrandLogo variant="compact" showTagline linkToHome={false} />
            </div>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-bold text-white/90 hover:bg-white/10"
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/publish"
              onClick={() => setOpen(false)}
              className="block rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-bold"
            >
              {t("nav.publishShort")}
            </NavLink>
            <NavLink
              to={user ? dashboardPathForRole(user.role) : "/client/login"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-white/80"
            >
              <User2 size={16} /> {user ? t("nav.account") : t("nav.login")}
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
