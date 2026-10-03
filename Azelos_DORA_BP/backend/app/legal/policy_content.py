"""Policy document bodies (informational; not legal advice — review by qualified counsel before production)."""

from __future__ import annotations

from app.legal.policy_catalog import PolicyKey

_Bodies: dict[PolicyKey, dict[str, str]] = {
    "terms_of_service": {
        "en": """# Terms of Service

These Terms of Service ("Terms") govern access to and use of the DORA Blueprint platform (the "Platform").

## Nature of the service

The Platform provides software tools to help organizations manage operational resilience and related workflows. **The Platform does not provide legal, regulatory, or professional advice.** You remain solely responsible for your regulatory, legal, compliance, and business decisions.

## Your account and organization

You are responsible for safeguarding credentials, for activity under your account, and for ensuring that users you authorize comply with these Terms.

## Data and content you provide

You represent that you have the necessary rights and permissions to enter, upload, or process data in the Platform. You must not upload or process data you are not authorized to handle.

## Third-party services

The Platform may rely on third-party infrastructure or services (for example cloud hosting, databases, or identity providers). Those services are subject to their own terms and limitations.

## Availability and changes

We may modify, suspend, or discontinue features with reasonable notice where practicable. Maintenance, upgrades, failures, or events outside our reasonable control may interrupt availability.

## Limitation of liability

**To the extent permitted by applicable law**, the Platform is provided subject to the limitations and exclusions set out in these Terms. Nothing in these Terms excludes or limits liability that cannot be excluded or limited under mandatory applicable law.

## Governing approach

If a provision of these Terms is unenforceable, the remaining provisions remain in effect. Material changes to these Terms may require you to accept an updated version before continued use.
""",
        "fr": """# Conditions d'utilisation

Les présentes conditions d'utilisation (« Conditions ») régissent l'accès et l'utilisation de la plateforme DORA Blueprint (la « Plateforme »).

## Nature du service

La Plateforme fournit des outils logiciels pour aider les organisations à gérer la résilience opérationnelle et les workflows associés. **La Plateforme ne fournit pas de conseils juridiques, réglementaires ou professionnels.** Vous restez seul responsable de vos décisions réglementaires, juridiques, de conformité et métier.

## Votre compte et votre organisation

Vous êtes responsable de la protection de vos identifiants, de l'activité réalisée sous votre compte et du respect de ces Conditions par les utilisateurs que vous autorisez.

## Données et contenus que vous fournissez

Vous déclarez disposer des droits et autorisations nécessaires pour saisir, téléverser ou traiter des données dans la Plateforme. Vous ne devez pas téléverser ou traiter des données que vous n'êtes pas autorisé à utiliser.

## Services tiers

La Plateforme peut s'appuyer sur des infrastructures ou services tiers (par exemple hébergement cloud, bases de données ou fournisseurs d'identité), soumis à leurs propres conditions et limites.

## Disponibilité et évolutions

Nous pouvons modifier, suspendre ou retirer des fonctionnalités avec un préavis raisonnable lorsque c'est possible. La maintenance, les mises à jour, les pannes ou des événements hors de notre contrôle raisonnable peuvent interrompre la disponibilité.

## Limitation de responsabilité

**Dans la mesure permise par le droit applicable**, la Plateforme est fournie sous réserve des limitations et exclusions prévues aux présentes Conditions. Rien dans ces Conditions n'exclut ou ne limite une responsabilité qui ne peut l'être en vertu d'une règle impérative applicable.

## Dispositions générales

Si une disposition est inapplicable, les autres dispositions restent en vigueur. Des modifications substantielles peuvent exiger une nouvelle acceptation avant la poursuite de l'utilisation.
""",
    },
    "privacy_policy": {
        "en": """# Privacy Policy

This Privacy Policy describes how personal and organizational data may be processed when you use the Platform.

## Data you provide

We process account information (such as email and name), organization profile data, and operational data you enter for resilience and compliance workflows.

## Purposes

Data is processed to provide the service, secure access, support auditability, and improve reliability. We do not sell personal data.

## Processors and hosting

Data may be stored and processed using cloud infrastructure selected by the operator of your deployment. Sub-processors are bound by appropriate contractual safeguards where required by law.

## Retention

Retention follows your organization's operational needs, backup policies, and applicable legal requirements configured for your deployment.

## Your responsibilities

You are responsible for providing appropriate notices and obtaining necessary consents from your users and data subjects where required by applicable privacy law.

## Contact

Privacy inquiries should be directed to your platform operator or organization administrator.

**This summary is not legal advice.**
""",
        "fr": """# Politique de confidentialité

La présente politique décrit comment les données personnelles et organisationnelles peuvent être traitées lors de l'utilisation de la Plateforme.

## Données que vous fournissez

Nous traitons les informations de compte (e-mail, nom), les données de profil organisationnel et les données opérationnelles saisies pour les workflows de résilience et de conformité.

## Finalités

Les données sont traitées pour fournir le service, sécuriser les accès, permettre l'auditabilité et améliorer la fiabilité. Nous ne vendons pas de données personnelles.

## Sous-traitants et hébergement

Les données peuvent être stockées et traitées via une infrastructure cloud choisie par l'exploitant de votre déploiement. Les sous-traitants sont soumis à des garanties contractuelles appropriées lorsque la loi l'exige.

## Conservation

La durée de conservation dépend des besoins opérationnels de votre organisation, des politiques de sauvegarde et des exigences légales applicables à votre déploiement.

## Vos responsabilités

Vous êtes responsable de fournir les informations requises et d'obtenir les consentements nécessaires auprès de vos utilisateurs et des personnes concernées lorsque la loi l'exige.

## Contact

Les demandes relatives à la vie privée doivent être adressées à l'exploitant de la plateforme ou à l'administrateur de votre organisation.

**Ce résumé ne constitue pas un conseil juridique.**
""",
    },
    "data_loss_service_disclaimer": {
        "en": """# Data Loss & Service Availability Disclaimer

## No guarantee of perfect availability

The Platform may experience interruptions due to maintenance, software defects, infrastructure failures, third-party provider outages, network issues, or force majeure events.

## No guarantee against data loss

**The Platform does not guarantee that data will never be lost, corrupted, unavailable, or accidentally deleted.** You are responsible for maintaining appropriate backups and recovery procedures for data that is critical to your organization, consistent with your regulatory and business requirements.

## Backups

Where backup features exist in your deployment, they must be configured, monitored, and tested by you or your operator. Backup failure or misconfiguration may result in unrecoverable loss.

## To the extent permitted by applicable law

Service and data disclaimers apply subject to mandatory rights that cannot be waived in your jurisdiction.
""",
        "fr": """# Avertissement — perte de données et disponibilité du service

## Absence de garantie de disponibilité parfaite

La Plateforme peut connaître des interruptions en raison de maintenance, de défauts logiciels, de pannes d'infrastructure, d'indisponibilités de fournisseurs tiers, de problèmes réseau ou de force majeure.

## Absence de garantie contre la perte de données

**La Plateforme ne garantit pas que les données ne seront jamais perdues, corrompues, indisponibles ou supprimées par erreur.** Vous êtes responsable de mettre en place des sauvegardes et procédures de reprise appropriées pour les données critiques, conformément à vos exigences réglementaires et métier.

## Sauvegardes

Lorsque des fonctions de sauvegarde existent dans votre déploiement, vous ou votre exploitant devez les configurer, surveiller et tester. Une sauvegarde défaillante ou mal configurée peut entraîner une perte irréversible.

## Dans la mesure permise par le droit applicable

Les avertissements s'appliquent sous réserve des droits impératifs qui ne peuvent être exclus dans votre juridiction.
""",
    },
    "acceptable_use": {
        "en": """# Acceptable Use Policy

You agree not to misuse the Platform, including:

- Uploading malware or attempting unauthorized access
- Processing data without legal basis or authorization
- Interfering with other tenants or platform stability
- Using the Platform for unlawful purposes

You are responsible for the accuracy and lawfulness of data you enter. The Platform operator may suspend access for violations, **to the extent permitted by applicable law** and contractual agreements.
""",
        "fr": """# Politique d'utilisation acceptable

Vous vous engagez à ne pas faire un usage abusif de la Plateforme, notamment :

- Téléverser des logiciels malveillants ou tenter un accès non autorisé
- Traiter des données sans base légale ou autorisation
- Perturber d'autres clients ou la stabilité de la plateforme
- Utiliser la Plateforme à des fins illicites

Vous êtes responsable de l'exactitude et de la licéité des données saisies. L'exploitant peut suspendre l'accès en cas de violation, **dans la mesure permise par le droit applicable** et les accords contractuels.
""",
    },
    "security_responsibility": {
        "en": """# Security & Responsibility Disclaimer

Security controls in the Platform reduce risk but **cannot eliminate all risk**. You are responsible for:

- Configuring roles and access appropriately within your organization
- Protecting endpoints and credentials used to access the Platform
- Evaluating whether your use meets your regulatory and internal security policies

**To the extent permitted by applicable law**, the platform operator is not responsible for losses arising from your configuration choices, user actions, or third-party incidents outside reasonable security controls described in your agreement.
""",
        "fr": """# Avertissement — sécurité et responsabilités

Les mesures de sécurité de la Plateforme réduisent les risques mais **ne peuvent éliminer tous les risques**. Vous êtes responsable de :

- Configurer correctement les rôles et accès au sein de votre organisation
- Protéger les postes et identifiants utilisés pour accéder à la Plateforme
- Évaluer si votre usage respecte vos exigences réglementaires et de sécurité internes

**Dans la mesure permise par le droit applicable**, l'exploitant n'est pas responsable des pertes résultant de vos choix de configuration, des actions des utilisateurs ou d'incidents tiers hors des contrôles de sécurité raisonnables décrits dans votre accord.
""",
    },
}


def get_policy_content(key: PolicyKey, locale: str) -> str:
    loc = "fr" if locale.lower().startswith("fr") else "en"
    return _Bodies[key][loc]
