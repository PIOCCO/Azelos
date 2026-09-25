import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../lib/api";
import LanguageSwitcher from "./LanguageSwitcher";
import BrandLogo from "./BrandLogo";
import { MAIN_SITE_NAV } from "../config/mainNav";

export default function SiteHeader() {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `home-nav-link ${isActive ? "home-nav-link-active" : ""}`;

  return (
    <header className="home-header sticky top-0 z-50 border-b border-ink-200/80 bg-white/95 backdrop-blur-sm">
      <div className="border-b border-navy-900/40 bg-navy">
        <div className="home-container flex h-9 items-center justify-end">
          <LanguageSwitcher variant="dark" />
        </div>
      </div>

      <div className="home-container flex h-[72px] items-center justify-between gap-4 lg:h-[80px]">
        <BrandLogo variant="header" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t("nav.home")}>
          {MAIN_SITE_NAV.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {t(l.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <NavLink to={dashboardPathForRole(user.role)} className="home-nav-link text-xs">
                {user.name.split(" ")[0]}
              </NavLink>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="grid h-10 w-10 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-50 hover:text-navy"
                aria-label={t("nav.logout")}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <NavLink to="/client/login" className="home-nav-link text-xs">
              {t("nav.login")}
            </NavLink>
          )}
          <Link to="/owner/login" className="home-btn home-btn-primary">
            {t("homePage.nav.promoter")}
          </Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center text-ink-800 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white lg:hidden">
          <nav className="home-container flex flex-col py-3">
            {MAIN_SITE_NAV.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2.5 text-sm font-semibold ${isActive ? "text-navy" : "text-ink-700"}`
                }
              >
                {t(l.labelKey)}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink
                  to={dashboardPathForRole(user.role)}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-sm font-semibold text-ink-700"
                >
                  {t("nav.account")}
                </NavLink>
                <button
                  type="button"
                  className="py-2.5 text-start text-sm font-semibold text-ink-700"
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                    navigate("/");
                  }}
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <NavLink to="/client/login" onClick={() => setOpen(false)} className="py-2.5 text-sm text-ink-700">
                {t("nav.login")}
              </NavLink>
            )}
            <Link
              to="/owner/login"
              onClick={() => setOpen(false)}
              className="home-btn home-btn-primary mt-2 text-center"
            >
              {t("homePage.nav.promoter")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
