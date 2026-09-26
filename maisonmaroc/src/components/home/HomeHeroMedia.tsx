import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "../SmartImage";
import type { HomeHeroSlide } from "./homeHeroSlide";
import { HOME_HERO_TIMING } from "../../config/apioHomepageImages";

export type HomeHeroMediaProps = {
  slides: HomeHeroSlide[];
  /** Fallback alt when slide alt is empty */
  defaultAlt?: string;
  fallbackSeed?: string;
  timing?: typeof HOME_HERO_TIMING;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function preloadImage(src: string) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

export default function HomeHeroMedia({
  slides,
  defaultAlt = "",
  fallbackSeed = "home-hero",
  timing = HOME_HERO_TIMING,
}: HomeHeroMediaProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [motionKey, setMotionKey] = useState(0);
  const pausedRef = useRef(false);
  const count = slides.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      const i = ((next % count) + count) % count;
      setIndex(i);
      setMotionKey((k) => k + 1);
    },
    [count],
  );

  const goNext = useCallback(() => go(index + 1), [go, index]);
  const goPrev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (count <= 1 || pausedRef.current) return undefined;
    const hold = reducedMotion ? timing.displayMs * 1.4 : timing.displayMs;
    const id = window.setInterval(() => {
      if (!pausedRef.current) go(index + 1);
    }, hold);
    return () => window.clearInterval(id);
  }, [count, go, index, reducedMotion, timing.displayMs]);

  useEffect(() => {
    if (count <= 1) return;
    const next = (index + 1) % count;
    const after = (index + 2) % count;
    preloadImage(slides[next]?.src ?? "");
    if (count > 2) preloadImage(slides[after]?.src ?? "");
  }, [count, index, slides]);

  if (count === 0) {
    return <div className="home-hero-media home-hero-media--empty" aria-hidden />;
  }

  const fadeClass = reducedMotion ? "home-hero-media__slide--fade-reduced" : "home-hero-media__slide--fade";

  return (
    <div
      className="home-hero-media home-hero-media--cinema"
      data-slide-count={count}
      aria-roledescription="carousel"
      aria-label="Séquence visuelle APIO"
    >
      {slides.map((slide, i) => {
        const isActive = i === index;
        const alt = slide.alt || defaultAlt;
        return (
          <div
            key={slide.src}
            className={`home-hero-media__slide ${fadeClass} ${isActive ? "home-hero-media__slide--active" : ""}`}
            aria-hidden={!isActive}
            style={
              {
                "--hero-fade-ms": `${timing.fadeMs}ms`,
                "--hero-object-pos": slide.objectPosition ?? "center center",
                "--hero-object-pos-mobile": slide.objectPositionMobile ?? slide.objectPosition ?? "center center",
              } as React.CSSProperties
            }
          >
            <div
              className={`home-hero-media__motion ${isActive && !reducedMotion ? "home-hero-media__motion--active" : ""}`}
              key={isActive ? `motion-${motionKey}` : `motion-idle-${i}`}
            >
              <SmartImage
                src={slide.src}
                srcSet={slide.srcSet}
                sizes="100vw"
                alt={isActive ? alt : ""}
                className="home-hero-media__img"
                fallbackSeed={`${fallbackSeed}-${i}`}
                loading={i === 0 || i === 1 ? "eager" : "lazy"}
                fetchPriority={isActive ? "high" : i === (index + 1) % count ? "low" : "auto"}
                decoding="async"
              />
            </div>
            {slide.caption && isActive ? (
              <span className="sr-only">{slide.caption}</span>
            ) : null}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <div className="home-hero-media__progress" aria-hidden>
            {slides.map((_, i) => (
              <span
                key={i}
                className={`home-hero-media__dot ${i === index ? "home-hero-media__dot--active" : ""}`}
              />
            ))}
          </div>
          <div className="home-hero-media__controls">
            <button
              type="button"
              className="home-hero-media__nav"
              onClick={() => {
                pausedRef.current = true;
                goPrev();
                window.setTimeout(() => {
                  pausedRef.current = false;
                }, timing.displayMs * 2);
              }}
              aria-label="Image précédente"
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button
              type="button"
              className="home-hero-media__nav"
              onClick={() => {
                pausedRef.current = true;
                goNext();
                window.setTimeout(() => {
                  pausedRef.current = false;
                }, timing.displayMs * 2);
              }}
              aria-label="Image suivante"
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            {slides[index]?.alt}
          </p>
        </>
      )}
    </div>
  );
}
