import { NavLink } from "react-router-dom";
import { Home, Search, Heart, MessageSquare, User2 } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { useMessaging } from "../context/MessagingContext";

export default function MobileNav() {
  const { t } = useLocale();
  const { count } = useFavorites();
  const { user } = useAuth();
  const { unreadCount } = useMessaging();

  const messagesTo =
    user?.role === "REAL_ESTATE_OWNER"
      ? "/owner/messages"
      : user?.role === "CLIENT"
        ? "/client/messages"
        : "/client/login";

  const accountTo =
    user?.role === "REAL_ESTATE_OWNER"
      ? "/owner"
      : user?.role === "CLIENT"
        ? "/client/account"
        : "/client/login";

  const items = [
    { to: "/", icon: Home, label: t("nav.home"), end: true },
    { to: "/search", icon: Search, label: t("nav.properties") },
    { to: messagesTo, icon: MessageSquare, label: t("nav.messages"), badge: unreadCount },
    { to: "/favorites", icon: Heart, label: t("nav.favorites"), badge: count },
    { to: accountTo, icon: User2, label: t("nav.account") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {items.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                isActive ? "text-brand-700" : "text-ink-500"
              }`
            }
          >
            <span className="relative">
              <Icon size={20} />
              {badge && badge > 0 ? (
                <span className="absolute -top-1.5 -end-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand-700 px-1 text-[9px] font-bold text-white">
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
