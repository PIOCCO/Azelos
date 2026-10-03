import { Bell, ChevronDown, HelpCircle, LogOut } from "lucide-react";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { useAuth } from "../../contexts/AuthContext";
import { useOrg } from "../../contexts/OrgContext";
import { useState } from "react";
import { useTranslation } from "../../i18n/LocaleContext";

export function TopBar() {
  const { t } = useTranslation();
  const { session, logout } = useAuth();
  const { organizationName, isLoading } = useOrg();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = session?.email?.split("@")[0] ?? "User";

  return (
    <header className="z-30 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-surface px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 pl-10 md:pl-0">
        <button
          type="button"
          className="flex max-w-[200px] items-center gap-1 truncate rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800"
          aria-haspopup="listbox"
          aria-label={t("common.organization")}
          disabled
          title="Organization is determined by your login; switching requires backend support."
        >
          <span className="truncate">
            {isLoading ? `${t("common.loading")}…` : organizationName ?? t("common.organization")}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        </button>
      </div>
      <div className="min-w-0 flex-1 max-md:absolute max-md:left-14 max-md:right-4 max-md:top-16 max-md:z-20 md:relative md:top-auto">
        <GlobalSearchBar />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Notifications (not configured)"
          disabled
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Help"
          disabled
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
              aria-hidden
            >
              {displayName.slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden text-sm font-medium text-gray-800 sm:inline capitalize">
              {displayName.replace(/\./g, " ")}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            >
              <p className="px-3 py-2 text-xs text-gray-500">{session?.email}</p>
              <p className="px-3 pb-2 text-xs text-gray-500">
                {t("common.role")}: {session?.role}
              </p>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {t("common.signOut")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
