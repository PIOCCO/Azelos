import { Link, useLocation } from "react-router-dom";
import { useModuleNav, useModuleNavMode } from "../../contexts/OrgContext";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { filterNavSections, NAV_SECTIONS } from "../../lib/navigation";
import { isNavItemActive } from "../../lib/navActive";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Sidebar() {
  const { session } = useAuth();
  const modules = useModuleNav();
  const moduleNavMode = useModuleNavMode();
  const location = useLocation();
  const isAdmin = can(session?.role, "org.admin");
  const sections = filterNavSections(NAV_SECTIONS, modules, moduleNavMode, isAdmin, session?.role);
  const allNavPaths = sections.flatMap((s) => s.items.map((i) => i.path));
  const [mobileOpen, setMobileOpen] = useState(false);

  const navBody = (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
          D
        </div>
        <span className="text-base font-semibold text-white">DORA Blueprint</span>
      </div>
      <nav className="space-y-6 px-3 pb-6" aria-label="Main">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isNavItemActive(location.pathname, item.path, allNavPaths);
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-primary text-white"
                          : "text-gray-300 hover:bg-sidebar-hover hover:text-white"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-lg border border-gray-200 bg-white p-2 shadow md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-sidebar">
            <button
              type="button"
              className="absolute right-3 top-4 rounded p-1 text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {navBody}
          </aside>
        </div>
      ) : null}
      <aside className="hidden h-dvh w-64 shrink-0 overflow-y-auto overscroll-y-contain bg-sidebar md:flex md:flex-col lg:w-72">
        {navBody}
      </aside>
    </>
  );
}
