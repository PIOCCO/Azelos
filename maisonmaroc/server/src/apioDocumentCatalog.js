/** Institutional document catalog for APIO (French titles/descriptions). */

export const DOCUMENT_CATEGORY_ORDER = [
  "institutionnel",
  "membres",
  "professionnel",
  "administratif",
  "juridique",
];

function tpl(title, intro, blocks) {
  const body = blocks
    .map((b) => {
      if (b.type === "h2") return `<h2>${b.text}</h2>`;
      if (b.type === "p") return `<p>${b.text}</p>`;
      if (b.type === "field") return `<p><strong>${b.label}</strong></p><div class="field"></div>`;
      return "";
    })
    .join("\n");
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>${title}</title>
<style>
body{font-family:Inter,system-ui,sans-serif;max-width:820px;margin:2rem auto;padding:0 1.25rem;color:#1a2332;line-height:1.55}
h1{font-family:Georgia,serif;font-size:1.45rem;margin-bottom:.5rem}
h2{font-size:1rem;margin-top:1.25rem;text-transform:uppercase;letter-spacing:.06em;color:#334155}
.notice{background:#f5f2ed;border:1px solid #e7e0d6;padding:.85rem 1rem;margin-bottom:1.25rem;font-size:.9rem}
.field{border-bottom:1px solid #cbd5e1;min-height:1.75rem;margin:.35rem 0 1rem}
.meta{font-size:.85rem;color:#64748b}
</style></head><body>
<div class="notice"><strong>Modèle à compléter</strong> — Ce document est un modèle interne APIO. Il ne constitue pas un acte officiel tant qu'il n'a pas été revu et adopté par les instances compétentes de l'association.</div>
<h1>${title}</h1>
<p class="meta">${intro}</p>
${body}
</body></html>`;
}

export const APIO_DOCUMENT_TEMPLATES = {
  "doc-formulaire-adhesion": tpl(
    "Formulaire d'adhésion — APIO",
    "À remplir par le promoteur immobilier candidat à l'adhésion.",
    [
      { type: "h2", text: "Identité du demandeur" },
      { type: "field", label: "Raison sociale / Nom complet" },
      { type: "field", label: "Forme juridique" },
      { type: "field", label: "Registre commerce / ICE (si applicable)" },
      { type: "field", label: "Adresse professionnelle" },
      { type: "field", label: "Ville / Région d'activité" },
      { type: "field", label: "Téléphone / E-mail" },
      { type: "h2", text: "Engagement" },
      {
        type: "p",
        text: "Le signataire demande son adhésion à l'Association des Promoteurs Immobiliers de l'Oriental (APIO) et s'engage à respecter les statuts, le règlement intérieur et la charte des membres une fois ce dossier validé.",
      },
      { type: "field", label: "Date" },
      { type: "field", label: "Signature et cachet" },
    ],
  ),
  "doc-dossier-adhesion": tpl(
    "Dossier d'adhésion — APIO",
    "Liste des pièces à fournir (cocher lors du dépôt).",
    [
      { type: "p", text: "☐ Formulaire d'adhésion dûment complété et signé" },
      { type: "p", text: "☐ Bulletin d'adhésion signé" },
      { type: "p", text: "☐ Extrait des statuts de la société ou pièce d'identité professionnelle" },
      { type: "p", text: "☐ Attestation d'inscription au registre professionnel (si applicable)" },
      { type: "p", text: "☐ Justificatif de domiciliation / siège social" },
      { type: "p", text: "☐ Règlement de la cotisation (sur instruction de l'APIO)" },
      { type: "p", text: "☐ Toute pièce complémentaire demandée par le bureau" },
    ],
  ),
  "doc-bulletin-adhesion": tpl(
    "Bulletin d'adhésion — APIO",
    "Document à signer par le membre adhérent.",
    [
      { type: "p", text: "Je soussigné(e), représentant(e) légal(e) de l'entreprise ci-dessous, demande mon adhésion à l'APIO." },
      { type: "field", label: "Nom / Raison sociale" },
      { type: "field", label: "Qualité du signataire" },
      { type: "field", label: "Date d'effet souhaitée" },
      { type: "p", text: "Je reconnais avoir pris connaissance des conditions d'adhésion et m'engage à respecter les règles de l'association." },
      { type: "field", label: "Fait à — Le — Signature" },
    ],
  ),
  "doc-formulaire-renouvellement": tpl(
    "Formulaire de renouvellement d'adhésion — APIO",
    "À compléter chaque année civile ou selon la période fixée par le bureau.",
    [
      { type: "field", label: "Membre (raison sociale)" },
      { type: "field", label: "Numéro de membre (si attribué)" },
      { type: "field", label: "Coordonnées mises à jour" },
      { type: "field", label: "Activité principale / projets en cours" },
      { type: "p", text: "Je certifie l'exactitude des informations et renouvelle mon adhésion à l'APIO." },
      { type: "field", label: "Date — Signature" },
    ],
  ),
  "doc-fiche-projet": tpl(
    "Fiche de présentation d'un projet immobilier — APIO",
    "Modèle de fiche pour présenter un projet au sein du réseau APIO.",
    [
      { type: "field", label: "Intitulé du projet" },
      { type: "field", label: "Promoteur membre APIO" },
      { type: "field", label: "Localisation (ville, quartier, références)" },
      { type: "field", label: "Nature du projet (résidentiel, commercial, mixte…)" },
      { type: "field", label: "Surface / nombre de lots (indicatif)" },
      { type: "field", label: "Calendrier prévisionnel" },
      { type: "field", label: "Contact projet (nom, e-mail, téléphone)" },
      { type: "p", text: "Description synthétique du projet et informations complémentaires :" },
      { type: "field", label: "" },
    ],
  ),
  "doc-formulaire-declaration-projet": tpl(
    "Formulaire de déclaration d'un projet — APIO",
    "Permet à un membre de signaler un nouveau projet à l'association.",
    [
      { type: "field", label: "Membre déclarant" },
      { type: "field", label: "Intitulé du projet" },
      { type: "field", label: "Commune / ville" },
      { type: "field", label: "Statut du projet (étude, commercialisation, livraison…)" },
      { type: "field", label: "Date de début de commercialisation (prévue ou effective)" },
      { type: "p", text: "Le membre certifie que les informations communiquées sont sincères et pourront être publiées sur les supports APIO après validation." },
      { type: "field", label: "Date — Signature" },
    ],
  ),
  "doc-modele-fiche-promoteur": tpl(
    "Modèle de fiche promoteur — APIO",
    "Profil public type pour l'annuaire des membres (après validation).",
    [
      { type: "field", label: "Raison sociale" },
      { type: "field", label: "Logo (fichier séparé)" },
      { type: "field", label: "Présentation (150 à 400 mots)" },
      { type: "field", label: "Villes d'intervention" },
      { type: "field", label: "Site web / réseaux sociaux" },
      { type: "field", label: "Contact public (e-mail / téléphone)" },
    ],
  ),
  "doc-modele-fiche-projet": tpl(
    "Modèle de fiche projet — APIO",
    "Fiche courte pour la vitrine projets du site.",
    [
      { type: "field", label: "Titre commercial du projet" },
      { type: "field", label: "Ville" },
      { type: "field", label: "Type de bien" },
      { type: "field", label: "Fourchette de prix ou « sur demande »" },
      { type: "field", label: "Points forts (3 à 5 puces)" },
      { type: "field", label: "Lien ou contact" },
    ],
  ),
  "doc-guide-bonnes-pratiques": tpl(
    "Guide des bonnes pratiques — Promoteurs immobiliers (APIO)",
    "Orientations générales — à compléter et valider par l'association.",
    [
      { type: "h2", text: "1. Transparence vis-à-vis des acquéreurs" },
      { type: "p", text: "Communiquer des informations claires sur le projet, les délais indicatifs et les documents disponibles, sans promesse non confirmée." },
      { type: "h2", text: "2. Conformité et autorisations" },
      { type: "p", text: "S'assurer du respect des autorisations urbanistiques et réglementations en vigueur ; l'APIO ne se substitue pas aux autorités compétentes." },
      { type: "h2", text: "3. Coopération entre membres" },
      { type: "p", text: "Favoriser l'échange d'expérience, le respect mutuel et la qualité professionnelle au sein du réseau." },
      { type: "h2", text: "4. Sections à compléter par l'APIO" },
      { type: "field", label: "Pratiques recommandées spécifiques à la région" },
      { type: "field", label: "Procédures internes APIO" },
    ],
  ),
  "doc-guide-promoteurs": tpl(
    "Guide des promoteurs immobiliers — APIO",
    "Document cadre — contenu détaillé à valider par le bureau.",
    [
      { type: "p", text: "Ce guide présente le rôle de l'APIO, les services aux membres et les bonnes pratiques attendues dans le cadre associatif." },
      { type: "h2", text: "Sommaire (à compléter)" },
      { type: "p", text: "1. Présentation de l'association" },
      { type: "p", text: "2. Adhésion et droits des membres" },
      { type: "p", text: "3. Publication des projets et communication" },
      { type: "p", text: "4. Éthique professionnelle et conformité" },
      { type: "field", label: "Annexes et ressources" },
    ],
  ),
  "doc-referentiel-professionnel": tpl(
    "Référentiel professionnel — APIO",
    "Cadre de compétences et exigences minimales — modèle à valider.",
    [
      { type: "field", label: "Compétences techniques attendues" },
      { type: "field", label: "Compétences juridiques et administratives" },
      { type: "field", label: "Engagements déontologiques" },
      { type: "field", label: "Indicateurs de suivi (à définir par l'APIO)" },
    ],
  ),
};

/** @type {Array<{id:string,category:string,sortOrder:number,titleFr:string,descriptionFr:string,availability:'coming_soon'|'template'|'online',fileFormat:string,viewUrl?:string,templateKey?:string}>} */
export const APIO_DOCUMENT_CATALOG = [
  // Institutionnel
  { id: "doc-presentation-apio", category: "institutionnel", sortOrder: 1, titleFr: "Présentation de l'APIO", descriptionFr: "Document de présentation institutionnelle de l'association (mission, gouvernance, services).", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-statuts", category: "institutionnel", sortOrder: 2, titleFr: "Statuts de l'association", descriptionFr: "Statuts officiels enregistrés — version publiée après validation par les instances compétentes.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-reglement-interieur", category: "institutionnel", sortOrder: 3, titleFr: "Règlement intérieur", descriptionFr: "Règles de fonctionnement interne de l'association.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-charte-association", category: "institutionnel", sortOrder: 4, titleFr: "Charte de l'association", descriptionFr: "Principes et valeurs adoptés par l'APIO.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-organigramme", category: "institutionnel", sortOrder: 5, titleFr: "Organigramme de l'association", descriptionFr: "Structure des organes et responsabilités (version officielle à publier).", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-rapport-activite", category: "institutionnel", sortOrder: 6, titleFr: "Rapport d'activité", descriptionFr: "Synthèse annuelle des activités — publiée après approbation.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-rapport-moral", category: "institutionnel", sortOrder: 7, titleFr: "Rapport moral", descriptionFr: "Bilan moral présenté en assemblée générale.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-rapport-financier", category: "institutionnel", sortOrder: 8, titleFr: "Rapport financier", descriptionFr: "États et commentaires financiers validés — sans diffusion de données non approuvées.", availability: "coming_soon", fileFormat: "PDF" },
  // Membres
  { id: "doc-formulaire-adhesion", category: "membres", sortOrder: 1, titleFr: "Formulaire d'adhésion", descriptionFr: "Modèle de demande d'adhésion pour les promoteurs candidats.", availability: "template", fileFormat: "HTML", templateKey: "doc-formulaire-adhesion" },
  { id: "doc-dossier-adhesion", category: "membres", sortOrder: 2, titleFr: "Dossier d'adhésion", descriptionFr: "Checklist des pièces à assembler pour un dossier complet.", availability: "template", fileFormat: "HTML", templateKey: "doc-dossier-adhesion" },
  { id: "doc-bulletin-adhesion", category: "membres", sortOrder: 3, titleFr: "Bulletin d'adhésion", descriptionFr: "Bulletin type à signer lors de l'entrée en association.", availability: "template", fileFormat: "HTML", templateKey: "doc-bulletin-adhesion" },
  { id: "doc-charte-membres", category: "membres", sortOrder: 4, titleFr: "Charte des membres", descriptionFr: "Engagements réciproques et règles de conduite au sein du réseau.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-conditions-adhesion", category: "membres", sortOrder: 5, titleFr: "Conditions d'adhésion", descriptionFr: "Critères et modalités d'adhésion fixés par l'APIO.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-cotisation-annuelle", category: "membres", sortOrder: 6, titleFr: "Cotisation annuelle", descriptionFr: "Barème et modalités de paiement — publiés après décision officielle.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-formulaire-renouvellement", category: "membres", sortOrder: 7, titleFr: "Formulaire de renouvellement d'adhésion", descriptionFr: "Modèle pour le renouvellement périodique de l'adhésion.", availability: "template", fileFormat: "HTML", templateKey: "doc-formulaire-renouvellement" },
  // Professionnel
  { id: "doc-guide-promoteurs", category: "professionnel", sortOrder: 1, titleFr: "Guide des promoteurs immobiliers", descriptionFr: "Guide cadre pour les membres — contenu détaillé à valider par l'APIO.", availability: "template", fileFormat: "HTML", templateKey: "doc-guide-promoteurs" },
  { id: "doc-guide-bonnes-pratiques", category: "professionnel", sortOrder: 2, titleFr: "Guide des bonnes pratiques", descriptionFr: "Orientations professionnelles et éthiques — modèle évolutif.", availability: "template", fileFormat: "HTML", templateKey: "doc-guide-bonnes-pratiques" },
  { id: "doc-referentiel-professionnel", category: "professionnel", sortOrder: 3, titleFr: "Référentiel professionnel", descriptionFr: "Référentiel de compétences et exigences — à compléter institutionnellement.", availability: "template", fileFormat: "HTML", templateKey: "doc-referentiel-professionnel" },
  { id: "doc-fiche-projet", category: "professionnel", sortOrder: 4, titleFr: "Fiche de présentation d'un projet immobilier", descriptionFr: "Modèle de fiche projet pour communication interne et vitrine.", availability: "template", fileFormat: "HTML", templateKey: "doc-fiche-projet" },
  { id: "doc-formulaire-declaration-projet", category: "professionnel", sortOrder: 5, titleFr: "Formulaire de déclaration d'un projet", descriptionFr: "Signalement d'un nouveau projet par un membre.", availability: "template", fileFormat: "HTML", templateKey: "doc-formulaire-declaration-projet" },
  { id: "doc-modele-fiche-promoteur", category: "professionnel", sortOrder: 6, titleFr: "Modèle de fiche promoteur", descriptionFr: "Profil type pour l'annuaire des membres.", availability: "template", fileFormat: "HTML", templateKey: "doc-modele-fiche-promoteur" },
  { id: "doc-modele-fiche-projet", category: "professionnel", sortOrder: 7, titleFr: "Modèle de fiche projet", descriptionFr: "Fiche courte pour la présentation publique d'un projet.", availability: "template", fileFormat: "HTML", templateKey: "doc-modele-fiche-projet" },
  // Administratif
  { id: "doc-proces-verbaux", category: "administratif", sortOrder: 1, titleFr: "Procès-verbaux", descriptionFr: "PV des instances — publication sélective après validation.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-convocations-ag", category: "administratif", sortOrder: 2, titleFr: "Convocations aux assemblées", descriptionFr: "Modèles et convocations officielles des assemblées générales.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-ordres-du-jour", category: "administratif", sortOrder: 3, titleFr: "Ordres du jour", descriptionFr: "Ordres du jour des réunions statutaires.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-comptes-rendus", category: "administratif", sortOrder: 4, titleFr: "Comptes rendus de réunions", descriptionFr: "Comptes rendus approuvés des instances de gouvernance.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-communiques-officiels", category: "administratif", sortOrder: 5, titleFr: "Communiqués officiels", descriptionFr: "Communiqués publiés au nom de l'association.", availability: "coming_soon", fileFormat: "PDF" },
  { id: "doc-notes-information", category: "administratif", sortOrder: 6, titleFr: "Notes d'information", descriptionFr: "Notes destinées aux membres ou au public.", availability: "coming_soon", fileFormat: "PDF" },
  // Juridique
  { id: "doc-mentions-legales", category: "juridique", sortOrder: 1, titleFr: "Mentions légales", descriptionFr: "Informations légales relatives au site et à l'éditeur.", availability: "online", fileFormat: "En ligne", viewUrl: "/legal/mentions-legales" },
  { id: "doc-politique-confidentialite", category: "juridique", sortOrder: 2, titleFr: "Politique de confidentialité", descriptionFr: "Traitement des données personnelles sur le site APIO.", availability: "online", fileFormat: "En ligne", viewUrl: "/legal/confidentialite" },
  { id: "doc-politique-cookies", category: "juridique", sortOrder: 3, titleFr: "Politique relative aux cookies", descriptionFr: "Usage des cookies et traceurs.", availability: "online", fileFormat: "En ligne", viewUrl: "/legal/cookies" },
  { id: "doc-cgu", category: "juridique", sortOrder: 4, titleFr: "Conditions générales d'utilisation", descriptionFr: "Conditions d'utilisation du site et des services en ligne.", availability: "online", fileFormat: "En ligne", viewUrl: "/legal/cgu" },
  { id: "doc-charte-donnees", category: "juridique", sortOrder: 5, titleFr: "Charte de protection des données", descriptionFr: "Engagements de l'association en matière de protection des données — version officielle à publier.", availability: "coming_soon", fileFormat: "PDF" },
];
