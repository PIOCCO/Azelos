import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import CookieConsent from "./CookieConsent";

const MINIMAL_FOOTER_PATHS = [
  "/client/login",
  "/client/register",
  "/owner/login",
  "/admin/login",
];

export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const minimalFooter = MINIMAL_FOOTER_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {!isHome && <Header />}
      <main className={`flex-1 ${isHome ? "" : "fade-in pb-20 lg:pb-0"}`}>
        <Outlet />
      </main>
      {!isHome && !minimalFooter && <Footer />}
      {!minimalFooter && <CookieConsent />}
      {!isHome && <MobileNav />}
    </div>
  );
}
