export type FooterLink = { to: string; labelKey: string };

export const FOOTER_MAIN_NAV: FooterLink[] = [
  { to: "/", labelKey: "homePage.nav.home" },
  { to: "/a-propos", labelKey: "homePage.nav.about" },
  { to: "/actualites", labelKey: "homePage.nav.news" },
  { to: "/faq", labelKey: "homePage.nav.faq" },
];

export const FOOTER_RESOURCE_LINKS: FooterLink[] = [
  { to: "/documents", labelKey: "homePage.footer.allDocuments" },
  { to: "/documents?category=institutionnel", labelKey: "homePage.footer.docInstitutionnel" },
  { to: "/documents?category=professionnel", labelKey: "homePage.footer.docProfessionnel" },
  { to: "/documents?category=administratif", labelKey: "homePage.footer.docAdministratif" },
  { to: "/documents?category=juridique", labelKey: "homePage.footer.docJuridique" },
  { to: "/actualites", labelKey: "homePage.footer.publications" },
];

export const FOOTER_LEGAL_LINKS: FooterLink[] = [
  { to: "/legal/mentions-legales", labelKey: "homePage.footer.mentions" },
  { to: "/legal/confidentialite", labelKey: "homePage.footer.privacyPolicy" },
  { to: "/legal/conditions-utilisation", labelKey: "homePage.footer.termsLong" },
  { to: "/legal/cookies", labelKey: "homePage.footer.cookiesPolicy" },
];
