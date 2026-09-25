/** Primary institutional navigation (visible header only — routes remain available elsewhere). */
export type MainNavItem = {
  to: string;
  labelKey: "homePage.nav.home" | "homePage.nav.about" | "homePage.nav.news" | "homePage.nav.documents";
  end?: boolean;
};

export const MAIN_SITE_NAV: MainNavItem[] = [
  { to: "/", labelKey: "homePage.nav.home", end: true },
  { to: "/a-propos", labelKey: "homePage.nav.about" },
  { to: "/actualites", labelKey: "homePage.nav.news" },
  { to: "/documents", labelKey: "homePage.nav.documents" },
];
