import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../../lib/useLocale";
import LanguageSwitcher from "../LanguageSwitcher";
import BrandLogo from "../BrandLogo";

export default function HomeHeader() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const mainLinks = [
    { to: "/", label: t("homePage.nav.home"), end: true },
    { to: "/a-propos", label: t("homePage.nav.about") },
    { to: "/membres", label: t("homePage.nav.members") },
    { to: "/projets", label: t("homePage.nav.projects") },
    { to: "/actualites", label: t("homePage.nav.news") },
    { to: "/contact", label: t("homePage.nav.contact") },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `home-nav-link ${isActive ? "home-nav-link-active" : ""}`;

  return (
    <header className="home-header sticky top-0 z-50 border-b border-ink-200/80 bg-white/95 backdrop-blur-sm">
      <div className="border-b border-brand-800/30 bg-brand-700">
        <div className="home-container flex h-9 items-center justify-end">
          <LanguageSwitcher variant="dark" />
        </div>
      </div>

      <div className="home-container flex h-[72px] items-center justify-between gap-4 lg:h-[80px]">
        <BrandLogo variant="header" />

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label={t("nav.home")}>
          {mainLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <NavLink to="/evenements" className="home-nav-link text-xs">
            {t("homePage.nav.events")}
          </NavLink>
          <NavLink to="/documents" className="home-nav-link text-xs">
            {t("homePage.nav.documents")}
          </NavLink>
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
            {mainLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2.5 text-sm font-semibold ${isActive ? "text-brand-700" : "text-ink-700"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/evenements" onClick={() => setOpen(false)} className="py-2.5 text-sm text-ink-700">
              {t("homePage.nav.events")}
            </NavLink>
            <NavLink to="/documents" onClick={() => setOpen(false)} className="py-2.5 text-sm text-ink-700">
              {t("homePage.nav.documents")}
            </NavLink>
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
