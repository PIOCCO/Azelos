import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import HomeFooter from "./home/HomeFooter";
import MobileNav from "./MobileNav";
import CookieConsent from "./CookieConsent";
import SkipLink from "./SkipLink";
import { usesInstitutionalChrome } from "../config/institutionalRoutes";

const MINIMAL_FOOTER_PATHS = [
  "/client/login",
  "/client/register",
  "/owner/login",
  "/admin/login",
];

export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const institutional = usesInstitutionalChrome(pathname);
  const minimalFooter = MINIMAL_FOOTER_PATHS.some((p) => pathname.startsWith(p));
  const showMarketplaceMobileNav = !isHome && !institutional && !minimalFooter;
  const mainPadding = showMarketplaceMobileNav ? "fade-in pb-20 lg:pb-0" : institutional ? "fade-in" : "";

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SkipLink />
      {!isHome && <Header />}
      <main id="main-content" tabIndex={-1} className={`flex-1 outline-none ${isHome ? "" : mainPadding}`}>
        <Outlet />
      </main>
      {isHome ? null : institutional ? (
        !minimalFooter ? <HomeFooter /> : null
      ) : !minimalFooter ? (
        <Footer />
      ) : null}
      {!minimalFooter && <CookieConsent />}
      {showMarketplaceMobileNav && <MobileNav />}
    </div>
  );
}
