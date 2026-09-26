/** Homepage cinematic hero — reorder or replace slides without changing the component. */
export type HomeHeroSlide = {
  src: string;
  /** Responsive width variants (Unsplash or CDN); base `src` is the largest default. */
  srcSet?: string;
  alt: string;
  caption?: string;
  /** CSS object-position emphasis (desktop); mobile may use `objectPositionMobile`. */
  objectPosition?: string;
  objectPositionMobile?: string;
};

function u(id: string, w: number) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=82`;
}

function slide(id: string, alt: string, opts?: Partial<HomeHeroSlide>): HomeHeroSlide {
  const src = u(id, 1920);
  return {
    src,
    srcSet: `${u(id, 768)} 768w, ${u(id, 1280)} 1280w, ${u(id, 1920)} 1920w`,
    alt,
    ...opts,
  };
}

/** Visual story: region → architecture → habitat → ville → détail → espace public → paysage → signature. */
export const HOME_HERO_IMAGES: HomeHeroSlide[] = [
  slide(
    "photo-1486325212027-8081e485255e",
    "Vue urbaine élevée — paysage bâti de la région de l'Oriental",
    { caption: "Territoire & urbanisation", objectPosition: "center 35%", objectPositionMobile: "center 30%" },
  ),
  slide(
    "photo-1486406146926-c627a92ad1ab",
    "Architecture contemporaine — façades et lignes modernes",
    { caption: "Architecture", objectPosition: "center 45%" },
  ),
  slide(
    "photo-1545324418-cc1a3fa10c00",
    "Ensemble résidentiel — développement immobilier",
    { caption: "Habitat", objectPosition: "center 40%" },
  ),
  slide(
    "photo-1569982175971-d92b01cf8694",
    "Immeubles en contexte urbain marocain",
    { caption: "Ville", objectPosition: "center 50%" },
  ),
  slide(
    "photo-1600585154340-be6161a56a0c",
    "Détail de projet immobilier — volumes et matériaux",
    { caption: "Projet", objectPosition: "center 55%" },
  ),
  slide(
    "photo-1600607687644-c7171b42498f",
    "Intérieur et finitions architecturales",
    { caption: "Détail", objectPosition: "center 40%" },
  ),
  slide(
    "photo-1449824913935-59a10b8d2000",
    "Espace public et art de vivre en ville",
    { caption: "Espaces partagés", objectPosition: "center 45%" },
  ),
  slide(
    "photo-1500382017468-9049fed747ef",
    "Paysages ouverts — horizon de l'Oriental",
    { caption: "Paysage", objectPosition: "center 60%", objectPositionMobile: "center 50%" },
  ),
  slide(
    "photo-1600566753190-17f0baa2a6c3",
    "Architecture premium — clôture visuelle de la séquence",
    { caption: "Signature", objectPosition: "center 42%" },
  ),
];

export const HOME_HERO_TIMING = {
  /** Visible hold per slide (ms), excluding crossfade overlap */
  displayMs: 6200,
  /** Crossfade duration (ms) */
  fadeMs: 1400,
} as const;
