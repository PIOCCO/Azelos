import type { Bilingual } from "./types";

export type ContentBlock = { title: Bilingual; body: Bilingual };

export const aboutIntro: ContentBlock = {
  title: {
    fr: "Qui sommes-nous ?",
    ar: "من نحن؟",
  },
  body: {
    fr: "L'Association des Promoteurs Immobiliers de l'Oriental (APIO) regroupe des professionnels du secteur immobilier actifs dans la région de l'Oriental. L'association vise à favoriser la coopération entre promoteurs, à partager des informations utiles au secteur et à contribuer, dans un cadre professionnel, au développement urbain et immobilier de la région.",
    ar: "تجمع جمعية مقاولات التعمير بالجهة الشرقية (APIO) مهنيي القطاع العقاري العاملين في جهة الشرقية. تهدف الجمعية إلى تعزيز التعاون بين المقاولين، وتبادل المعلومات المفيدة للقطاع، والمساهمة في التنمية العمرانية والعقارية للجهة في إطار مهني.",
  },
};

export const missionPoints: ContentBlock[] = [
  {
    title: { fr: "Représentation", ar: "التمثيل" },
    body: {
      fr: "Appuyer la représentation des promoteurs immobiliers de la région dans un cadre associatif structuré.",
      ar: "دعم تمثيل مقاولات التعمير في الجهة في إطار جمعوي منظم.",
    },
  },
  {
    title: { fr: "Coopération professionnelle", ar: "التعاون المهني" },
    body: {
      fr: "Encourager l'échange d'expériences et la collaboration entre membres.",
      ar: "تشجيع تبادل الخبرات والتعاون بين الأعضاء.",
    },
  },
  {
    title: { fr: "Information sectorielle", ar: "معلومات القطاع" },
    body: {
      fr: "Diffuser des informations utiles relatives au secteur immobilier régional, sans substituer aux sources officielles.",
      ar: "نشر معلومات مفيدة متعلقة بالقطاع العقاري بالجهة دون أن تحل محل المصادر الرسمية.",
    },
  },
  {
    title: { fr: "Développement responsable", ar: "تنمية مسؤولة" },
    body: {
      fr: "Promouvoir une approche professionnelle et responsable du développement immobilier et urbain.",
      ar: "تعزيز نهجًا مهنيًا ومسؤولًا للتنمية العقارية والعمرانية.",
    },
  },
];

export const services: ContentBlock[] = [
  {
    title: { fr: "Annuaire des membres", ar: "دليل الأعضاء" },
    body: {
      fr: "Consultation des promoteurs membres et de leurs profils publics autorisés.",
      ar: "الاطلاع على المقاولين الأعضاء وملفاتهم العامة المعتمدة.",
    },
  },
  {
    title: { fr: "Projets immobiliers", ar: "المشاريع العقارية" },
    body: {
      fr: "Présentation des projets publiés par les membres, selon les informations mises à disposition.",
      ar: "عرض المشاريع المنشورة من طرف الأعضاء وفق المعلومات المتاحة.",
    },
  },
  {
    title: { fr: "Actualités & annonces", ar: "أخبار وإعلانات" },
    body: {
      fr: "Informations, communiqués et annonces publiés par l'association.",
      ar: "معلومات وبلاغات وإعلانات تنشرها الجمعية.",
    },
  },
  {
    title: { fr: "Événements", ar: "الفعاليات" },
    body: {
      fr: "Agenda des rencontres et activités professionnelles lorsqu'ils sont programmés.",
      ar: "جدول اللقاءات والأنشطة المهنية عند برمجتها.",
    },
  },
  {
    title: { fr: "Publications", ar: "المنشورات" },
    body: {
      fr: "Documents et ressources rendus publics par l'association.",
      ar: "وثائق وموارد تنشرها الجمعية للعموم.",
    },
  },
];

export const roleOfAssociation: ContentBlock = {
  title: {
    fr: "Rôle de l'association",
    ar: "دور الجمعية",
  },
  body: {
    fr: "APIO agit comme cadre de concertation entre promoteurs immobiliers de l'Oriental : facilitation des échanges professionnels, valorisation des bonnes pratiques, et mise à disposition d'outils d'information (annuaire, projets, actualités, documents) sous le contrôle de son administration. L'association ne se substitue pas aux autorités compétentes ni aux obligations légales des opérateurs du secteur.",
    ar: "تعمل APIO كإطار للتشاور بين مقاولات التعمير بالجهة الشرقية: تسهيل التبادل المهني، تعزيز الممارسات الجيدة، وتوفير أدوات معلوماتية (دليل، مشاريع، أخبار، وثائق) تحت إشراف إدارتها. لا تحل الجمعية محل السلطات المختصة ولا الالتزامات القانونية للفاعلين.",
  },
};

export const regionIntro: ContentBlock = {
  title: {
    fr: "L'Oriental, territoire d'APIO",
    ar: "الجهة الشرقية، نطاق APIO",
  },
  body: {
    fr: "APIO intervient dans la région de l'Oriental (Maroc), incluant notamment les principales agglomérations où ses membres exercent leur activité : Oujda, Nador, Berkane, Saïdia et d'autres centres urbains de la région. Cette page présente le cadre géographique de l'association ; les données chiffrées officielles pourront être ajoutées ultérieurement après validation.",
    ar: "تعمل APIO في جهة الشرقية (المغرب)، بما في ذلك التجمعات الحضرية الرئيسية حيث يمارس أعضاؤها نشاطهم: وجدة، الناظور، بركان، السعيدية ومراكز حضرية أخرى بالجهة. تعرض هذه الصفحة الإطار الجغرافي للجمعية؛ يمكن إضافة البيانات الرسمية لاحقًا بعد التحقق.",
  },
};

export const faqItems: { q: Bilingual; a: Bilingual }[] = [
  {
    q: {
      fr: "Comment contacter APIO ?",
      ar: "كيف أتواصل مع APIO؟",
    },
    a: {
      fr: "Utilisez le formulaire de contact du site. Les coordonnées officielles complètes seront publiées dès validation par l'association.",
      ar: "استخدم نموذج الاتصال بالموقع. سيتم نشر بيانات الاتصال الرسمية الكاملة بعد اعتمادها من الجمعية.",
    },
  },
  {
    q: {
      fr: "Comment devenir membre promoteur ?",
      ar: "كيف تصبح عضوًا مقاولًا؟",
    },
    a: {
      fr: "L'adhésion et la création de comptes promoteurs sont gérées par l'administration de l'association. Il n'existe pas d'inscription promoteur en libre-service sur ce site.",
      ar: "تُدار العضوية وإنشاء حسابات المقاولين من طرف إدارة الجمعية. لا يوجد تسجيل ذاتي للمقاولين على هذا الموقع.",
    },
  },
  {
    q: {
      fr: "Les projets affichés sont-ils garantis par APIO ?",
      ar: "هل المشاريع المعروضة مضمونة من APIO؟",
    },
    a: {
      fr: "Les fiches projets sont publiées par les membres ou l'administration selon les informations fournies. APIO ne se substitue pas aux démarches légales ou commerciales entre acheteurs, investisseurs et promoteurs.",
      ar: "تُنشر بطاقات المشاريع من طرف الأعضاء أو الإدارة وفق المعلومات المقدمة. لا تحل APIO محل الإجراءات القانونية أو التجارية بين المشترين والمستثمرين والمقاولين.",
    },
  },
];
