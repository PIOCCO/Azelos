import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  UserCircle,
  X,
  BadgeCheck,
  ClipboardList,
} from "lucide-react";
import { useLocale } from "../../lib/useLocale";
import { useAuth } from "../../context/AuthContext";
import { useMessaging } from "../../context/MessagingContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
    isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
  }`;

export default function OwnerPortalLayout() {
  const { t, isRTL, changeLang, lang } = useLocale();
  const { user, logout } = useAuth();
  const { unreadCount } = useMessaging();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { to: "/owner", end: true, icon: LayoutDashboard, label: t("ownerPortal.nav.dashboard") },
    { to: "/owner/profile", icon: UserCircle, label: t("ownerPortal.nav.profile") },
    { to: "/owner/profile/public", icon: BadgeCheck, label: t("ownerPortal.nav.publicProfile") },
    { to: "/owner/projects", icon: FolderKanban, label: t("ownerPortal.nav.projects") },
    { to: "/owner/documents", icon: FileText, label: t("ownerPortal.nav.documents") },
    { to: "/owner/membership", icon: ClipboardList, label: t("ownerPortal.nav.membership") },
    { to: "/owner/requests", icon: Activity, label: t("ownerPortal.nav.requests") },
    { to: "/owner/notifications", icon: Bell, label: t("ownerPortal.nav.notifications"), badge: unreadCount },
    { to: "/owner/messages", icon: MessageSquare, label: t("nav.messages"), badge: unreadCount },
    { to: "/owner/settings", icon: Settings, label: t("ownerPortal.nav.settings") },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/60">APIO</p>
        <p className="mt-1 text-sm font-semibold text-white">{t("ownerPortal.portalTitle")}</p>
        <p className="mt-2 truncate text-xs text-white/70">{user?.name}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label={t("ownerPortal.nav.main")}>
        {nav.map(({ to, end, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} end={end} className={navClass} onClick={() => setMobileOpen(false)}>
            <Icon size={18} aria-hidden />
            <span className="flex-1">{label}</span>
            {badge != null && badge > 0 && (
              <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
          onClick={async () => {
            await logout();
            navigate("/owner/login");
          }}
        >
          <LogOut size={18} aria-hidden />
          {t("nav.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100" dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-navy hover:bg-ink-50"
          aria-expanded={mobileOpen}
          aria-controls="owner-portal-drawer"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
          <span className="sr-only">{t("ownerPortal.openMenu")}</span>
        </button>
        <span className="text-sm font-bold text-navy">APIO</span>
        <div className="flex gap-1">
          <button type="button" className="rounded-lg px-2 py-1 text-xs font-bold text-navy" onClick={() => changeLang(lang === "fr" ? "ar" : "fr")}>
            {lang === "fr" ? "العربية" : "FR"}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" id="owner-portal-drawer">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("ownerPortal.closeMenu")} onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-[min(100%,280px)] bg-navy shadow-xl">{sidebar}</aside>
          <button
            type="button"
            className="absolute top-3 end-3 rounded-lg bg-navy p-2 text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-6 lg:px-4 lg:py-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl bg-navy lg:block">{sidebar}</aside>
        <div className="min-w-0 flex-1 px-4 py-6 lg:px-0">
          <div className="mb-4 hidden items-center justify-end gap-2 lg:flex">
            <button
              type="button"
              className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-bold text-navy hover:border-navy"
              onClick={() => changeLang(lang === "fr" ? "ar" : "fr")}
            >
              {lang === "fr" ? "العربية" : "Français"}
            </button>
            <Link to="/" className="text-xs font-semibold text-ink-500 hover:text-navy">
              {t("ownerPortal.backToSite")}
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
