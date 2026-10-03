import { NAV_SECTIONS } from "./navigation";

export interface NavSearchEntry {
  id: string;
  /** i18n key for display label */
  labelKey: string;
  route: string;
  keywords: { en: string[]; fr: string[] };
  adminOnly?: boolean;
  platformAdminOnly?: boolean;
}

/** Settings and synonyms not covered by sidebar paths alone. */
const EXTRA_ENTRIES: NavSearchEntry[] = [
  {
    id: "settings-language",
    labelKey: "settings.language",
    route: "/settings/language",
    keywords: {
      en: ["language", "locale", "translation", "lang", "i18n", "english", "french"],
      fr: ["langue", "traduction", "localisation", "lang", "français", "anglais"],
    },
  },
  {
    id: "settings-overview",
    labelKey: "settings.overview",
    route: "/settings",
    keywords: {
      en: ["settings", "configuration", "config", "preferences", "general"],
      fr: ["paramètres", "configuration", "préférences", "général"],
    },
    adminOnly: true,
  },
  {
    id: "organization-profile",
    labelKey: "nav.organizationProfile",
    route: "/organization/profile",
    keywords: {
      en: ["profile", "organization", "account", "identity", "company"],
      fr: ["profil", "organisation", "compte", "identité", "entreprise"],
    },
  },
  {
    id: "settings-access",
    labelKey: "settings.usersAccess",
    route: "/settings/access",
    keywords: {
      en: ["users", "access", "team", "security", "rbac", "roles", "members", "account"],
      fr: ["utilisateurs", "accès", "équipe", "sécurité", "rôles", "membres", "compte"],
    },
    adminOnly: true,
  },
  {
    id: "settings-integrations",
    labelKey: "settings.integrations",
    route: "/settings/integrations",
    keywords: {
      en: ["integrations", "api", "connectors", "webhook"],
      fr: ["intégrations", "api", "connecteurs"],
    },
    adminOnly: true,
  },
  {
    id: "settings-cloud",
    labelKey: "settings.cloud",
    route: "/settings/cloud",
    keywords: {
      en: ["cloud", "azure", "environment", "inventory"],
      fr: ["cloud", "azure", "environnement", "inventaire"],
    },
    adminOnly: true,
  },
  {
    id: "settings-dora",
    labelKey: "settings.doraConfig",
    route: "/settings/dora",
    keywords: {
      en: ["dora", "modules", "applicability", "scope"],
      fr: ["dora", "modules", "applicabilité", "périmètre"],
    },
    adminOnly: true,
  },
  {
    id: "settings-custom-fields",
    labelKey: "settings.customFields",
    route: "/settings/custom-fields",
    keywords: {
      en: ["custom fields", "fields", "metadata", "attributes"],
      fr: ["champs personnalisés", "champs", "métadonnées"],
    },
    adminOnly: true,
  },
  {
    id: "onboarding",
    labelKey: "nav.getStarted",
    route: "/onboarding",
    keywords: {
      en: ["get started", "onboarding", "wizard", "setup"],
      fr: ["premiers pas", "démarrage", "assistant", "configuration"],
    },
  },
];

function navItemKeywords(labelKey: string): { en: string[]; fr: string[] } {
  const slug = labelKey.split(".").pop() ?? labelKey;
  return {
    en: [slug.replace(/([A-Z])/g, " $1").trim().toLowerCase()],
    fr: [],
  };
}

function entriesFromSidebar(): NavSearchEntry[] {
  const seen = new Set<string>();
  const out: NavSearchEntry[] = [];
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (seen.has(item.path)) continue;
      seen.add(item.path);
      out.push({
        id: `nav-${item.path.replace(/\//g, "-").replace(/^-/, "") || "home"}`,
        labelKey: item.labelKey,
        route: item.path,
        keywords: navItemKeywords(item.labelKey),
        adminOnly: item.adminOnly,
        platformAdminOnly: item.platformAdminOnly,
      });
    }
  }
  return out;
}

/** Central registry: sidebar routes + settings synonyms. */
export const NAV_SEARCH_REGISTRY: NavSearchEntry[] = [
  ...EXTRA_ENTRIES,
  ...entriesFromSidebar().filter((e) => !EXTRA_ENTRIES.some((x) => x.route === e.route)),
];
