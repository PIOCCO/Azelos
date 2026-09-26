/** Primary institutional navigation (header only — documents and legal live in the footer). */
export type MainNavItem = {
  to: string;
  labelKey: "homePage.nav.home" | "homePage.nav.about" | "homePage.nav.news" | "homePage.nav.faq";
  end?: boolean;
};

export const MAIN_SITE_NAV: MainNavItem[] = [
  { to: "/", labelKey: "homePage.nav.home", end: true },
  { to: "/a-propos", labelKey: "homePage.nav.about" },
  { to: "/actualites", labelKey: "homePage.nav.news" },
  { to: "/faq", labelKey: "homePage.nav.faq" },
];
