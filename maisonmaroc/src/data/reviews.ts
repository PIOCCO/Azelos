import type { Review } from "./types";

export const reviews: Review[] = [
  {
    id: "r1",
    ownerId: "ahmed-el-amrani",
    author: { ar: "منصف الحسني", fr: "Mouncef El Hassani" },
    rating: 5,
    text: {
      ar: "تعامل احترافي ومرافقة ممتازة، وجدت شقتي في حي القدس بوجدة في أسبوع واحد. أنصح به بشدة.",
      fr: "Accompagnement professionnel et excellent suivi, j'ai trouvé mon appartement à Hay Al Qods (Oujda) en une semaine. Je le recommande vivement.",
    },
    date: "2026-08-30",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
  },
  {
    id: "r2",
    ownerId: "ahmed-el-amrani",
    author: { ar: "ليلى بركة", fr: "Leïla Baraka" },
    rating: 5,
    text: {
      ar: "أحمد صادق وواضح في كل التفاصيل. تجربة شراء مريحة جدًا في وجدة.",
      fr: "Ahmed est honnête et transparent sur tous les détails. Une expérience d'achat très agréable à Oujda.",
    },
    date: "2026-07-18",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
  },
  {
    id: "r3",
    ownerId: "sara-benali",
    author: { ar: "خالد العلمي", fr: "Khalid Alami" },
    rating: 5,
    text: {
      ar: "سارة محترفة وتعرف سوق الناظور جيدًا. ساعدتني في الحصول على سعر ممتاز.",
      fr: "Sara est professionnelle et connaît bien le marché de Nador. Elle m'a aidé à obtenir un excellent prix.",
    },
    date: "2026-08-12",
    avatar: "https://randomuser.me/api/portraits/men/23.jpg",
  },
  {
    id: "r4",
    ownerId: "meryem-alaoui",
    author: { ar: "سمية بنجلون", fr: "Soumia Benjelloun" },
    rating: 5,
    text: {
      ar: "خدمة راقية جدًا تليق بالعقارات الفاخرة في وجدة. مريم مستشارة استثنائية.",
      fr: "Un service haut de gamme à la hauteur des biens de prestige à Oujda. Meryem est une conseillère exceptionnelle.",
    },
    date: "2026-09-01",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
  },
  {
    id: "r5",
    ownerId: "youssef-bennani",
    author: { ar: "رشيد أوباها", fr: "Rachid Oubaha" },
    rating: 4,
    text: {
      ar: "معرفة عميقة بسوق بركان والمنطقة الزراعية. مرافقة جيدة طوال المسار.",
      fr: "Grande connaissance du marché de Berkane et de la plaine d'Angads. Bon accompagnement tout au long du parcours.",
    },
    date: "2026-07-29",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    id: "r6",
    ownerId: "fatima-zahra-idrissi",
    author: { ar: "هند العزوزي", fr: "Hind El Azzouzi" },
    rating: 5,
    text: {
      ar: "سرعة استجابة مذهلة وشفافية كاملة. حصلت على شقة بإطلالة رائعة على البحر في السعيدية.",
      fr: "Réactivité impressionnante et transparence totale. J'ai obtenu un appartement avec une superbe vue sur mer à Saïdia.",
    },
    date: "2026-09-03",
    avatar: "https://randomuser.me/api/portraits/women/52.jpg",
  },
  {
    id: "r7",
    ownerId: "karim-tazi",
    author: { ar: "ياسين المرابط", fr: "Yassine El Mrabet" },
    rating: 4,
    text: {
      ar: "تعامل مباشر ومريح مع المالك، دون وسطاء. الاستوديو في بركان مطابق للصور تمامًا.",
      fr: "Échange direct et agréable avec le propriétaire, sans intermédiaire. Le studio à Berkane est exactement conforme aux photos.",
    },
    date: "2026-08-08",
    avatar: "https://randomuser.me/api/portraits/men/62.jpg",
  },
  {
    id: "r8",
    ownerId: "omar-fassi",
    author: { ar: "زينب الحمداوي", fr: "Zineb El Hamdaoui" },
    rating: 5,
    text: {
      ar: "خبرة كبيرة بسوق تاوريرت. ساعدني عمر في إيجاد منزل عائلي بسعر مناسب.",
      fr: "Grande expertise du marché de Taourirt. Omar m'a aidée à trouver une maison familiale à prix accessible.",
    },
    date: "2026-07-22",
    avatar: "https://randomuser.me/api/portraits/women/62.jpg",
  },
  {
    id: "r9",
    ownerId: "nadia-chraibi",
    author: { ar: "توفيق بلقاسم", fr: "Taoufik Belkacem" },
    rating: 5,
    text: {
      ar: "نادية ساعدت شركتنا في إيجاد المكتب المناسب بسرعة في وجدة. احترافية عالية.",
      fr: "Nadia a aidé notre entreprise à trouver rapidement le bureau idéal à Oujda. Grand professionnalisme.",
    },
    date: "2026-08-16",
    avatar: "https://randomuser.me/api/portraits/men/72.jpg",
  },
];

export const reviewsByOwner = (ownerId: string) =>
  reviews.filter((r) => r.ownerId === ownerId);
