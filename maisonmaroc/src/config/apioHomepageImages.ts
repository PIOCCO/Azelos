/**
 * Static decorative images for the APIO institutional homepage.
 * Files live in `public/APIO/homepage-style/` — replace in place, then build/deploy.
 * Do not use for listings, members, projects, or CMS uploads.
 */
import type { HomeHeroSlide } from "../components/home/homeHeroSlide";

const STYLE_SEGMENT = "homepage-style";

/**
 * URL for a file under `public/APIO/homepage-style/`.
 * Production (e.g. https://dribex.ma/APIO/): `/APIO/homepage-style/...`
 */
export function homepageStyleUrl(relativePath: string): string {
  const rel = relativePath.replace(/^\/+/, "");
  const configured = (import.meta.env.BASE_URL ?? "/").trim();
  if (configured !== "./" && configured !== "." && configured !== "/" && configured !== "") {
    const prefix = configured.replace(/\/+$/, "");
    return `${prefix}/${STYLE_SEGMENT}/${rel}`;
  }
  return `/APIO/${STYLE_SEGMENT}/${rel}`;
}

export const APIO_HOMEPAGE_IMAGES = {
  about: {
    wide: homepageStyleUrl("about-wide.webp"),
    left: homepageStyleUrl("about-left.webp"),
    right: homepageStyleUrl("about-right.webp"),
  },
  region: {
    left: [homepageStyleUrl("region-left-01.webp"), homepageStyleUrl("region-left-02.webp")],
    rightTall: homepageStyleUrl("region-right-tall.webp"),
    rightSmall: [homepageStyleUrl("region-right-01.webp"), homepageStyleUrl("region-right-02.webp")],
  },
  cta: homepageStyleUrl("cta.webp"),
} as const;

/** Hero filenames in `homepage-style/hero/` — replace files keeping the same names. */
const HERO_SLIDE_FILES = [
  {
    file: "hero-01.webp",
    alt: "Vue urbaine élevée — paysage bâti de la région de l'Oriental",
    caption: "Territoire & urbanisation",
    objectPosition: "center 35%",
    objectPositionMobile: "center 30%",
  },
  {
    file: "hero-02.webp",
    alt: "Architecture contemporaine — façades et lignes modernes",
    caption: "Architecture",
    objectPosition: "center 45%",
  },
  {
    file: "hero-03.webp",
    alt: "Ensemble résidentiel — développement immobilier",
    caption: "Habitat",
    objectPosition: "center 40%",
  },
  {
    file: "hero-04.webp",
    alt: "Immeubles en contexte urbain marocain",
    caption: "Ville",
    objectPosition: "center 50%",
  },
  {
    file: "hero-05.webp",
    alt: "Détail de projet immobilier — volumes et matériaux",
    caption: "Projet",
    objectPosition: "center 55%",
  },
  {
    file: "hero-06.webp",
    alt: "Intérieur et finitions architecturales",
    caption: "Détail",
    objectPosition: "center 40%",
  },
  {
    file: "hero-07.webp",
    alt: "Espace public et art de vivre en ville",
    caption: "Espaces partagés",
    objectPosition: "center 45%",
  },
  {
    file: "hero-08.webp",
    alt: "Paysages ouverts — horizon de l'Oriental",
    caption: "Paysage",
    objectPosition: "center 60%",
    objectPositionMobile: "center 50%",
  },
  {
    file: "hero-09.webp",
    alt: "Architecture premium — clôture visuelle de la séquence",
    caption: "Signature",
    objectPosition: "center 42%",
  },
] as const;

export const HOME_HERO_IMAGES: HomeHeroSlide[] = HERO_SLIDE_FILES.map((slide) => ({
  src: homepageStyleUrl(`hero/${slide.file}`),
  alt: slide.alt,
  caption: slide.caption,
  objectPosition: slide.objectPosition,
  objectPositionMobile: "objectPositionMobile" in slide ? slide.objectPositionMobile : undefined,
}));

export const HOME_HERO_TIMING = {
  displayMs: 6200,
  fadeMs: 1400,
} as const;
