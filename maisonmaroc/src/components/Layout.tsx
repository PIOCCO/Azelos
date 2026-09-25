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
  const minimalFooter = MINIMAL_FOOTER_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="fade-in flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
      {!minimalFooter && <Footer />}
      {!minimalFooter && <CookieConsent />}
      <MobileNav />
    </div>
  );
}
