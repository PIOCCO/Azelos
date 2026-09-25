import type { Bilingual } from "../data/types";
import { INSTITUTION } from "./institution";

export type LegalSection = { heading: Bilingual; paragraphs: Bilingual[] };

function frAr(fr: string, ar: string): Bilingual {
  return { fr, ar };
}

export const mentionsLegalesSections: LegalSection[] = [
  {
    heading: frAr("Éditeur du site", "ناشر الموقع"),
    paragraphs: [
      frAr(
        `${INSTITUTION.shortName.fr} — ${INSTITUTION.name.fr}. Statut : ${INSTITUTION.legalStatus}. Siège : ${INSTITUTION.address.fr}.`,
        `${INSTITUTION.shortName.ar} — ${INSTITUTION.name.ar}. الوضع القانوني: ${INSTITUTION.legalStatus}. المقر: ${INSTITUTION.address.ar}.`,
      ),
      frAr(
        `Immatriculation / identifiants officiels : ${INSTITUTION.registrationId}.`,
        `التسجيل / المعرفات الرسمية: ${INSTITUTION.registrationId}.`,
      ),
    ],
  },
  {
    heading: frAr("Directeur de publication", "مدير النشر"),
    paragraphs: [frAr(INSTITUTION.publicationDirector, INSTITUTION.publicationDirector)],
  },
  {
    heading: frAr("Responsable du site", "مسؤول الموقع"),
    paragraphs: [frAr(INSTITUTION.webmaster, INSTITUTION.webmaster)],
  },
  {
    heading: frAr("Hébergement", "الاستضافة"),
    paragraphs: [frAr(INSTITUTION.hostingProvider, INSTITUTION.hostingProvider)],
  },
  {
    heading: frAr("Propriété intellectuelle", "الملكية الفكرية"),
    paragraphs: [
      frAr(
        "Les contenus textuels, visuels et graphiques publiés sur ce site sont protégés. Toute reproduction non autorisée peut constituer une contrefaçon. Les marques et logos des tiers restent la propriété de leurs titulaires.",
        "المحتويات النصية والبصرية المنشورة على هذا الموقع محمية. أي استنساخ غير مصرح به قد يشكل انتهاكًا. العلامات والشعارات الخاصة بالغير تبقى ملكًا لأصحابها.",
      ),
    ],
  },
  {
    heading: frAr("Responsabilité", "المسؤولية"),
    paragraphs: [
      frAr(
        "APIO s'efforce d'assurer l'exactitude des informations publiées. Les fiches membres et projets relèvent des données fournies par leurs auteurs. Les liens externes n'engagent pas la responsabilité de l'association.",
        "تسعى APIO إلى ضمان دقة المعلومات المنشورة. بطاقات الأعضاء والمشاريع تعتمد على البيانات المقدمة من أصحابها. الروابط الخارجية لا تُلزم الجمعية.",
      ),
    ],
  },
  {
    heading: frAr("Droit applicable", "القانون الواجب التطبيق"),
    paragraphs: [
      frAr(
        `Le présent site est régi par le droit marocain. Compétence : ${INSTITUTION.jurisdiction.fr}.`,
        `يخضع هذا الموقع للقانون المغربي. الاختصاص: ${INSTITUTION.jurisdiction.ar}.`,
      ),
    ],
  },
];

export const privacySections: LegalSection[] = [
  {
    heading: frAr("Introduction", "مقدمة"),
    paragraphs: [
      frAr(
        "Cette politique décrit le traitement des données à caractère personnel dans le cadre du site APIO. Elle est rédigée pour faciliter la conformité aux exigences marocaines, notamment celles de la CNDP lorsque applicable. APIO ne prétend pas à une certification CNDP tant qu'aucune déclaration officielle n'a été validée.",
        "تصف هذه السياسة معالجة المعطيات ذات الطابع الشخصي في إطار موقع APIO. هي معدّة لتسهيل الامتثال للمتطلبات المغربية، بما في ذلك CNDP عند الاقتضاء. لا تدّعي APIO أي اعتماد CNDP ما لم يتم التحقق من تصريح رسمي.",
      ),
    ],
  },
  {
    heading: frAr("Données collectées", "البيانات المجمّعة"),
    paragraphs: [
      frAr(
        "Formulaire de contact : nom, prénom, e-mail, téléphone (optionnel), sujet, message. Comptes visiteurs/clients : identité, e-mail, téléphone, authentification. Comptes promoteurs et administrateurs : données de compte nécessaires à la gestion sécurisée. Journaux techniques : adresse IP tronquée/hachée, horodatages, événements de sécurité.",
        "نموذج الاتصال: الاسم، البريد، الهاتف (اختياري)، الموضوع، الرسالة. حسابات الزوار/العملاء: الهوية، البريد، الهاتف، المصادقة. حسابات المقاولين والإدارة: بيانات الحساب اللازمة للإدارة الآمنة. السجلات التقنية: عنوان IP مُختصر/مُجزّأ، الطوابع الزمنية، أحداث الأمان.",
      ),
    ],
  },
  {
    heading: frAr("Finalités", "الأغراض"),
    paragraphs: [
      frAr(
        "Répondre aux demandes de contact, gérer les comptes autorisés, publier les contenus institutionnels, assurer la sécurité du site, prévenir les abus (limitation de débit), améliorer le service dans le respect des droits des personnes.",
        "الرد على طلبات الاتصال، إدارة الحسابات المصرّح بها، نشر المحتوى المؤسساتي، ضمان أمان الموقع، منع الإساءة (تحديد المعدل)، تحسين الخدمة مع احترام حقوق الأشخاص.",
      ),
    ],
  },
  {
    heading: frAr("Conservation", "الحفظ"),
    paragraphs: [
      frAr(
        "Les durées de conservation seront définies par APIO selon la nature des données et les obligations légales. Les messages de contact sont conservés le temps nécessaire au traitement puis archivés ou supprimés selon la politique interne validée.",
        "تحدد APIO مدد الحفظ حسب طبيعة البيانات والالتزامات القانونية. تُحفظ رسائل الاتصال للمدة اللازمة للمعالجة ثم تُؤرشف أو تُحذف وفق السياسة الداخلية المعتمدة.",
      ),
    ],
  },
  {
    heading: frAr("Droits des personnes", "حقوق الأشخاص"),
    paragraphs: [
      frAr(
        "Vous pouvez demander l'accès, la rectification ou la suppression de vos données en contactant APIO à l'adresse officielle publiée sur le site. Déclaration CNDP (si applicable) : " +
          INSTITUTION.cndpDeclaration +
          ".",
        "يمكنكم طلب الوصول أو التصحيح أو الحذف عبر التواصل مع APIO على البريد الرسمي المنشور. تصريح CNDP (إن وُجد): " +
          INSTITUTION.cndpDeclaration +
          ".",
      ),
    ],
  },
  {
    heading: frAr("Sous-traitants et hébergement", "المعالجون والاستضافة"),
    paragraphs: [
      frAr(
        `Hébergeur : ${INSTITUTION.hostingProvider}. Les prestataires techniques agissant pour le compte d'APIO sont sélectionnés avec des garanties contractuelles appropriées.`,
        `المضيف: ${INSTITUTION.hostingProvider}. يُختار مزودو الخدمات التقنية لحساب APIO بضمانات تعاقدية مناسبة.`,
      ),
    ],
  },
];

export const cookiesSections: LegalSection[] = [
  {
    heading: frAr("Cookies essentiels", "Cookies essentiels / ضرورية"),
    paragraphs: [
      frAr(
        "Indispensables au fonctionnement : session d'authentification (HttpOnly, Secure en production), préférences de langue, consentement cookies.",
        "ضرورية للعمل: جلسة المصادقة (HttpOnly، Secure في الإنتاج)، تفضيلات اللغة، موافقة Cookies.",
      ),
    ],
  },
  {
    heading: frAr("Cookies fonctionnels", "Cookies fonctionnelles"),
    paragraphs: [
      frAr(
        "Peuvent mémoriser des choix d'interface. Aucun cookie marketing ou analytique tiers n'est chargé sans consentement explicite.",
        "قد تحفظ خيارات الواجهة. لا تُحمّل cookies تسويقية أو تحليلية من طرف ثالث دون موافقة صريحة.",
      ),
    ],
  },
  {
    heading: frAr("Gestion", "الإدارة"),
    paragraphs: [
      frAr(
        "Vous pouvez effacer les cookies via votre navigateur. Le bandeau du site enregistre votre choix pour les cookies non essentiels.",
        "يمكنكم مسح cookies من المتصفح. يسجل شريط الموقع اختياركم للcookies غير الضرورية.",
      ),
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    heading: frAr("Objet", "الموضوع"),
    paragraphs: [
      frAr(
        "Les présentes conditions régissent l'accès et l'utilisation du site institutionnel APIO par tout visiteur ou utilisateur autorisé.",
        "تنظم هذه الشروط الوصول إلى الموقع المؤسساتي لـ APIO واستخدامه من طرف أي زائر أو مستخدم مصرّح.",
      ),
    ],
  },
  {
    heading: frAr("Comptes", "الحسابات"),
    paragraphs: [
      frAr(
        "Les comptes promoteurs sont créés uniquement par l'administration APIO. Les utilisateurs sont responsables de la confidentialité de leurs identifiants.",
        "تُنشأ حسابات المقاولين حصريًا من طرف إدارة APIO. المستخدمون مسؤولون عن سرية بيانات الدخول.",
      ),
    ],
  },
  {
    heading: frAr("Contenus", "المحتويات"),
    paragraphs: [
      frAr(
        "Les informations sur les membres et projets sont publiées sous la responsabilité de leurs auteurs. Toute utilisation abusive, scraping massif ou tentative d'accès non autorisé est interdite.",
        "تُنشر معلومات الأعضاء والمشاريع تحت مسؤولية أصحابها. يُمنع أي استخدام مسيء أو scraping أو محاولة وصول غير مصرّح.",
      ),
    ],
  },
  {
    heading: frAr("Propriété intellectuelle", "الملكية الفكرية"),
    paragraphs: [
      frAr(
        "Le site, sa charte graphique et les contenus éditoriaux APIO sont protégés. Les contenus tiers restent soumis à leurs licences respectives.",
        "الموقع وهويته البصرية ومحتويات APIO التحريرية محمية. محتويات الغير تخضع لتراخيصها.",
      ),
    ],
  },
  {
    heading: frAr("Limitation de responsabilité", "تحديد المسؤولية"),
    paragraphs: [
      frAr(
        "APIO ne garantit pas une disponibilité ininterrompue du site. Les décisions d'investissement ou d'achat immobilier relèvent exclusivement des parties concernées.",
        "لا تضمن APIO توفرًا دائمًا للموقع. قرارات الاستثمار أو الشراء العقاري تقع على عاتق الأطراف المعنية حصرًا.",
      ),
    ],
  },
  {
    heading: frAr("Droit applicable", "القانون الواجب التطبيق"),
    paragraphs: [
      frAr(
        `Droit marocain — ${INSTITUTION.jurisdiction.fr}.`,
        `القانون المغربي — ${INSTITUTION.jurisdiction.ar}.`,
      ),
    ],
  },
];
