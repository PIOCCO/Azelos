import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "./SmartImage";

interface Props {
  images: string[];
  alt: string;
  seed: string;
}

export default function ImageGallery({ images, alt, seed }: Props) {
  const [active, setActive] = useState(0);
  const go = (dir: number) =>
    setActive((a) => (a + dir + images.length) % images.length);

  if (!images.length) {
    return (
      <div className="grid h-[280px] place-items-center rounded-2xl bg-ink-100 text-sm text-ink-500 sm:h-[440px]">
        —
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl">
        <SmartImage
          src={images[active]}
          fallbackSeed={`${seed}-${active}`}
          alt={alt}
          className="h-[280px] w-full object-cover sm:h-[440px]"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute start-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-700 shadow-md hover:bg-white"
              aria-label="prev"
            >
              <ChevronLeft className="rtl:hidden" size={20} />
              <ChevronRight className="hidden rtl:block" size={20} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute end-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-700 shadow-md hover:bg-white"
              aria-label="next"
            >
              <ChevronRight className="rtl:hidden" size={20} />
              <ChevronLeft className="hidden rtl:block" size={20} />
            </button>
            <div className="absolute bottom-3 start-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white rtl:translate-x-1/2">
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === active ? "ring-brand-500" : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <SmartImage
                src={img}
                fallbackSeed={`${seed}-thumb-${i}`}
                alt={`${alt} ${i + 1}`}
                className="h-16 w-24 object-cover sm:h-20 sm:w-28"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
