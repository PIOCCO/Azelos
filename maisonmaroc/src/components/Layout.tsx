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

function isOwnerMemberPortal(pathname: string) {
  return pathname === "/owner" || (pathname.startsWith("/owner/") && !pathname.startsWith("/owner/login"));
}

export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const ownerPortal = isOwnerMemberPortal(pathname);
  const institutional = usesInstitutionalChrome(pathname);
  const minimalFooter = MINIMAL_FOOTER_PATHS.some((p) => pathname.startsWith(p));
  const showMarketplaceMobileNav = !isHome && !institutional && !minimalFooter && !ownerPortal;
  const mainPadding = showMarketplaceMobileNav ? "fade-in pb-20 lg:pb-0" : institutional ? "fade-in" : "";

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SkipLink />
      {!isHome && !ownerPortal && <Header />}
      <main
        id="main-content"
        tabIndex={-1}
        className={`flex-1 outline-none ${isHome || ownerPortal ? "" : mainPadding}`}
      >
        <Outlet />
      </main>
      {isHome || ownerPortal ? null : institutional ? (
        !minimalFooter ? <HomeFooter /> : null
      ) : !minimalFooter ? (
        <Footer />
      ) : null}
      {!minimalFooter && !ownerPortal && <CookieConsent />}
      {showMarketplaceMobileNav && <MobileNav />}
    </div>
  );
}
