import { NavLink } from "react-router-dom";
import { Home, Search, Heart, PlusCircle, User2 } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useFavorites } from "../context/FavoritesContext";

export default function MobileNav() {
  const { t } = useLocale();
  const { count } = useFavorites();

  const items = [
    { to: "/", icon: Home, label: t("nav.home"), end: true },
    { to: "/search", icon: Search, label: t("nav.properties") },
    { to: "/publish", icon: PlusCircle, label: t("nav.publishShort") },
    { to: "/favorites", icon: Heart, label: t("nav.favorites"), badge: count },
    { to: "/client/account", icon: User2, label: t("nav.account") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {items.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition ${
                isActive ? "text-brand-600" : "text-ink-500"
              }`
            }
          >
            <span className="relative">
              <Icon size={21} />
              {badge && badge > 0 ? (
                <span className="absolute -top-1.5 -end-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
