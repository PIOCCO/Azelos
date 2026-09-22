import type { Review } from "./types";

export const reviews: Review[] = [
  {
    id: "r1",
    ownerId: "ahmed-el-amrani",
    author: { ar: "منصف الحسني", fr: "Mouncef El Hassani" },
    rating: 5,
    text: {
      ar: "تعامل احترافي ومرافقة ممتازة، وجدت شقتي في أسبوع واحد. أنصح به بشدة.",
      fr: "Accompagnement professionnel et excellent suivi, j'ai trouvé mon appartement en une semaine. Je le recommande vivement.",
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
      ar: "أحمد صادق وواضح في كل التفاصيل. تجربة شراء مريحة جدًا.",
      fr: "Ahmed est honnête et transparent sur tous les détails. Une expérience d'achat très agréable.",
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
      ar: "سارة محترفة وتعرف سوق الرباط جيدًا. ساعدتني في الحصول على سعر ممتاز.",
      fr: "Sara est professionnelle et connaît bien le marché de Rabat. Elle m'a aidé à obtenir un excellent prix.",
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
      ar: "خدمة راقية جدًا تليق بالعقارات الفاخرة. مريم مستشارة استثنائية.",
      fr: "Un service haut de gamme à la hauteur des biens de prestige. Meryem est une conseillère exceptionnelle.",
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
      ar: "معرفة عميقة بسوق مراكش والرياضات. مرافقة جيدة طوال المسار.",
      fr: "Grande connaissance du marché de Marrakech et des riads. Bon accompagnement tout au long du parcours.",
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
      ar: "سرعة استجابة مذهلة وشفافية كاملة. حصلت على شقة بإطلالة رائعة على البحر.",
      fr: "Réactivité impressionnante et transparence totale. J'ai obtenu un appartement avec une superbe vue sur mer.",
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
      ar: "تعامل مباشر ومريح مع المالك، دون وسطاء. الاستوديو مطابق للصور تمامًا.",
      fr: "Échange direct et agréable avec le propriétaire, sans intermédiaire. Le studio est exactement conforme aux photos.",
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
      ar: "خبرة كبيرة بالمدينة العتيقة. ساعدني عمر في اقتناء رياض أحلامي.",
      fr: "Grande expertise de la médina. Omar m'a aidée à acquérir le riad de mes rêves.",
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
      ar: "نادية ساعدت شركتنا في إيجاد المكتب المناسب بسرعة. احترافية عالية.",
      fr: "Nadia a aidé notre entreprise à trouver rapidement le bureau idéal. Grand professionnalisme.",
    },
    date: "2026-08-16",
    avatar: "https://randomuser.me/api/portraits/men/72.jpg",
  },
];

export const reviewsByOwner = (ownerId: string) =>
  reviews.filter((r) => r.ownerId === ownerId);
