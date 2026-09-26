/** Structured PDF content for APIO document templates (no invented official data). */

function spec(title, intro, blocks) {
  return { title, intro, blocks, template: true };
}

export const APIO_PDF_SPECS = {
  "doc-formulaire-adhesion": spec(
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
  "doc-dossier-adhesion": spec(
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
  "doc-bulletin-adhesion": spec(
    "Bulletin d'adhésion — APIO",
    "Document à signer par le membre adhérent.",
    [
      {
        type: "p",
        text: "Je soussigné(e), représentant(e) légal(e) de l'entreprise ci-dessous, demande mon adhésion à l'APIO.",
      },
      { type: "field", label: "Nom / Raison sociale" },
      { type: "field", label: "Qualité du signataire" },
      { type: "field", label: "Date d'effet souhaitée" },
      {
        type: "p",
        text: "Je reconnais avoir pris connaissance des conditions d'adhésion et m'engage à respecter les règles de l'association.",
      },
      { type: "field", label: "Fait à — Le — Signature" },
    ],
  ),
  "doc-formulaire-renouvellement": spec(
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
  "doc-fiche-projet": spec(
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
  "doc-formulaire-declaration-projet": spec(
    "Formulaire de déclaration d'un projet — APIO",
    "Permet à un membre de signaler un nouveau projet à l'association.",
    [
      { type: "field", label: "Membre déclarant" },
      { type: "field", label: "Intitulé du projet" },
      { type: "field", label: "Commune / ville" },
      { type: "field", label: "Statut du projet (étude, commercialisation, livraison…)" },
      { type: "field", label: "Date de début de commercialisation (prévue ou effective)" },
      {
        type: "p",
        text: "Le membre certifie que les informations communiquées sont sincères et pourront être publiées sur les supports APIO après validation.",
      },
      { type: "field", label: "Date — Signature" },
    ],
  ),
  "doc-modele-fiche-promoteur": spec(
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
  "doc-modele-fiche-projet": spec(
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
  "doc-guide-bonnes-pratiques": spec(
    "Guide des bonnes pratiques — Promoteurs immobiliers (APIO)",
    "Orientations générales — à compléter et valider par l'association.",
    [
      { type: "h2", text: "1. Transparence vis-à-vis des acquéreurs" },
      {
        type: "p",
        text: "Communiquer des informations claires sur le projet, les délais indicatifs et les documents disponibles, sans promesse non confirmée.",
      },
      { type: "h2", text: "2. Conformité et autorisations" },
      {
        type: "p",
        text: "S'assurer du respect des autorisations urbanistiques et réglementations en vigueur ; l'APIO ne se substitue pas aux autorités compétentes.",
      },
      { type: "h2", text: "3. Coopération entre membres" },
      {
        type: "p",
        text: "Favoriser l'échange d'expérience, le respect mutuel et la qualité professionnelle au sein du réseau.",
      },
      { type: "h2", text: "4. Sections à compléter par l'APIO" },
      { type: "field", label: "Pratiques recommandées spécifiques à la région" },
      { type: "field", label: "Procédures internes APIO" },
    ],
  ),
  "doc-guide-promoteurs": spec(
    "Guide des promoteurs immobiliers — APIO",
    "Document cadre — contenu détaillé à valider par le bureau.",
    [
      {
        type: "p",
        text: "Ce guide présente le rôle de l'APIO, les services aux membres et les bonnes pratiques attendues dans le cadre associatif.",
      },
      { type: "h2", text: "Sommaire (à compléter)" },
      { type: "p", text: "1. Présentation de l'association" },
      { type: "p", text: "2. Adhésion et droits des membres" },
      { type: "p", text: "3. Publication des projets et communication" },
      { type: "p", text: "4. Éthique professionnelle et conformité" },
      { type: "field", label: "Annexes et ressources" },
    ],
  ),
  "doc-referentiel-professionnel": spec(
    "Référentiel professionnel — APIO",
    "Cadre de compétences et exigences minimales — modèle à valider.",
    [
      { type: "field", label: "Compétences techniques attendues" },
      { type: "field", label: "Compétences juridiques et administratives" },
      { type: "field", label: "Engagements déontologiques" },
      { type: "field", label: "Indicateurs de suivi (à définir par l'APIO)" },
    ],
  ),
  "doc-presentation-apio": spec(
    "Présentation de l'APIO",
    "Document institutionnel — informations générales (sans données officielles non validées).",
    [
      {
        type: "p",
        text: "L'Association des Promoteurs Immobiliers de l'Oriental (APIO) regroupe des professionnels du secteur immobilier actifs dans la région de l'Oriental. L'association vise à favoriser la coopération entre promoteurs, à partager des informations utiles au secteur et à contribuer, dans un cadre professionnel, au développement urbain et immobilier de la région.",
      },
      { type: "h2", text: "Mission (résumé)" },
      { type: "p", text: "Représentation associée, coopération professionnelle, information sectorielle et promotion d'une approche responsable du développement immobilier." },
      { type: "h2", text: "Informations officielles à compléter" },
      { type: "field", label: "[Adresse officielle à compléter]" },
      { type: "field", label: "[Forme juridique / immatriculation à compléter]" },
      { type: "field", label: "[Instances de gouvernance et mandats à compléter]" },
      { type: "field", label: "[Coordonnées officielles de contact à compléter]" },
    ],
  ),
  "doc-charte-association": spec(
    "Charte / principes de fonctionnement — APIO",
    "Principes associatifs — version à adopter par les instances compétentes.",
    [
      { type: "p", text: "La présente charte fixe les principes généraux de fonctionnement de l'APIO. Son contenu définitif relève des instances statutaires de l'association." },
      { type: "h2", text: "Principes généraux (à compléter)" },
      { type: "field", label: "Valeurs et engagements de l'association" },
      { type: "field", label: "Règles de gouvernance interne" },
      { type: "field", label: "Relations avec les membres et le public" },
      { type: "field", label: "[Document officiel à fournir — version adoptée]" },
    ],
  ),
  "doc-organigramme": spec(
    "Organisation et gouvernance — APIO",
    "Schéma organisationnel — version officielle à publier après validation.",
    [
      { type: "p", text: "L'organigramme ci-dessous est un modèle de structure. Les intitulés, noms et mandats doivent être complétés par l'APIO." },
      { type: "field", label: "Assemblée générale" },
      { type: "field", label: "Bureau / Conseil d'administration" },
      { type: "field", label: "Présidence" },
      { type: "field", label: "Secrétariat / Trésorerie" },
      { type: "field", label: "Commissions ou comités thématiques" },
      { type: "field", label: "[Organigramme officiel à fournir]" },
    ],
  ),
  "doc-conditions-adhesion": spec(
    "Conditions d'adhésion — APIO",
    "Critères et modalités d'adhésion — à fixer et publier par le bureau.",
    [
      { type: "p", text: "Les conditions d'adhésion à l'APIO sont définies par les instances compétentes de l'association." },
      { type: "field", label: "[Critères d'éligibilité à compléter]" },
      { type: "field", label: "[Modalités de dépôt du dossier à compléter]" },
      { type: "field", label: "[Cotisation et obligations des membres à compléter]" },
      { type: "field", label: "[Document officiel à fournir]" },
    ],
  ),
  "doc-charte-professionnelle": spec(
    "Charte professionnelle — APIO",
    "Engagements déontologiques des membres — modèle à valider.",
    [
      { type: "p", text: "Cette charte professionnelle encadre les bonnes pratiques attendues des membres promoteurs au sein du réseau APIO." },
      { type: "field", label: "Engagements envers les clients et partenaires" },
      { type: "field", label: "Respect de la réglementation et des autorités compétentes" },
      { type: "field", label: "Coopération loyale entre membres" },
      { type: "field", label: "[Version adoptée par l'APIO à insérer]" },
    ],
  ),
  "doc-fiche-membre": spec(
    "Fiche d'informations du membre — APIO",
    "Informations administratives pour le suivi des adhésions.",
    [
      { type: "field", label: "Raison sociale / Nom du membre" },
      { type: "field", label: "Numéro de membre (si attribué)" },
      { type: "field", label: "Date d'adhésion" },
      { type: "field", label: "Coordonnées professionnelles" },
      { type: "field", label: "Interlocuteur principal" },
      { type: "field", label: "Observations internes (usage APIO)" },
    ],
  ),
  "doc-modele-correspondance": spec(
    "Modèle de correspondance officielle — APIO",
    "Courrier type pour communications institutionnelles.",
    [
      { type: "field", label: "Objet" },
      { type: "field", label: "Destinataire" },
      { type: "p", text: "Madame, Monsieur," },
      { type: "field", label: "Corps du message" },
      { type: "p", text: "Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées." },
      { type: "field", label: "Fait à — Le — Signature et cachet APIO" },
    ],
  ),
};

export function getPdfSpec(templateKey) {
  return APIO_PDF_SPECS[templateKey] || null;
}
