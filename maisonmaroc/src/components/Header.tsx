import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, PlusCircle, User2, Menu, X, LogOut, Home } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../lib/useLocale";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useLocale();
  const { count } = useFavorites();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/search", label: t("nav.properties") },
    { to: "/agents", label: t("nav.agents") },
  ];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive ? "text-white" : "text-ink-300 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/95 text-white backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="h-9 w-9" />
          <div className="leading-tight">
            <span className="block font-display text-lg font-extrabold text-white">
              {t("brand.name")}
            </span>
            <span className="hidden text-[10px] font-medium text-ink-300 sm:block">
              {t("brand.tagline")}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <Link to="/favorites" className="relative btn-ghost" aria-label={t("nav.favorites")}>
            <Heart size={18} />
            {count > 0 && (
              <span className="absolute -top-1 -end-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link to="/publish" className="btn-outline">
            <PlusCircle size={16} /> {t("nav.publish")}
          </Link>
          {user ? (
            <div className="flex items-center gap-1">
              <Link to="/account" className="btn-ghost">
                <User2 size={18} /> {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="btn-ghost"
                aria-label={t("nav.logout")}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary">
              <User2 size={16} /> {t("nav.login")}
            </Link>
          )}
        </div>

        <button
          className="btn-ghost lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink-950 lg:hidden">
          <div className="container-page space-y-1 py-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-200 hover:bg-white/10"
              >
                <Home size={16} /> {l.label}
              </NavLink>
            ))}
            <Link
              to="/publish"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              <PlusCircle size={16} /> {t("nav.publish")}
            </Link>
            <div className="flex items-center justify-between px-3 pt-2">
              <LanguageSwitcher />
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="btn-ghost"
                >
                  <LogOut size={16} /> {t("nav.logout")}
                </button>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="btn-primary">
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
