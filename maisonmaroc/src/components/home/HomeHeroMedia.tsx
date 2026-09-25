import SmartImage from "../SmartImage";

export type HomeHeroMediaProps = {
  /** One or more hero images; only `activeIndex` is visible until a carousel is added. */
  images: string[];
  activeIndex?: number;
  alt?: string;
  fallbackSeed?: string;
};

/**
 * Full-bleed hero image layer. Supports multiple slides (same layout) for a future carousel.
 */
export default function HomeHeroMedia({
  images,
  activeIndex = 0,
  alt = "",
  fallbackSeed = "home-hero",
}: HomeHeroMediaProps) {
  const safeIndex = images.length ? Math.min(Math.max(activeIndex, 0), images.length - 1) : 0;

  if (images.length === 0) {
    return <div className="home-hero-media home-hero-media--empty" aria-hidden />;
  }

  return (
    <div className="home-hero-media" data-slide-count={images.length}>
      {images.map((src, index) => {
        const isActive = index === safeIndex;
        return (
          <div
            key={`${src}-${index}`}
            className={`home-hero-media__slide ${isActive ? "home-hero-media__slide--active" : ""}`}
            aria-hidden={!isActive}
          >
            <SmartImage
              src={src}
              alt={isActive ? alt : ""}
              className="home-hero-media__img"
              fallbackSeed={`${fallbackSeed}-${index}`}
              loading={isActive ? "eager" : "lazy"}
              fetchPriority={isActive ? "high" : "auto"}
            />
          </div>
        );
      })}
    </div>
  );
}
