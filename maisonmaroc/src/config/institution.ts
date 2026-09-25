/** Editable institutional configuration — replace placeholders with official APIO data. */

export const INSTITUTION = {
  name: {
    fr: "Association des Promoteurs Immobiliers de l'Oriental",
    ar: "جمعية مقاولات التعمير بالجهة الشرقية",
  },
  shortName: { fr: "APIO", ar: "APIO" },
  tagline: {
    fr: "Promoteurs immobiliers au service du développement de l'Oriental",
    ar: "مقاولات التعمير في خدمة تنمية الجهة الشرقية",
  },
  /** @placeholder Official registered address */
  address: {
    fr: "[Adresse officielle à compléter — Oujda, Maroc]",
    ar: "[العنوان الرسمي — وجدة، المغرب]",
  },
  email: "contact@apio.ma",
  phone: "[Téléphone à compléter]",
  publicationDirector: "[Directeur de publication à compléter]",
  webmaster: "[Responsable du site à compléter]",
  hostingProvider: "[Hébergeur à compléter]",
  legalStatus: "[Forme juridique à compléter]",
  registrationId: "[Immatriculation / RC / ICE — à compléter si applicable]",
  cndpDeclaration: "[Déclaration CNDP — à compléter si applicable]",
  jurisdiction: { fr: "Maroc", ar: "المغرب" },
} as const;
