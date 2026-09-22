import { useState, type ImgHTMLAttributes } from "react";

interface SmartImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSeed?: string;
}

/**
 * Image with a guaranteed fallback: if the primary source fails, it swaps to a
 * deterministic placeholder so the UI never shows a broken image.
 */
export default function SmartImage({
  src,
  fallbackSeed,
  alt = "",
  ...rest
}: SmartImageProps) {
  const seed = fallbackSeed || encodeURIComponent(src).slice(-24) || "apio";
  const fallback = `https://picsum.photos/seed/${seed}/1200/800`;
  const [current, setCurrent] = useState(src);

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
      {...rest}
    />
  );
}
