import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { apiMediaUrl } from "../lib/api";

interface SmartImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSeed?: string;
}

const NEUTRAL_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect fill="#eceae6" width="100%" height="100%"/></svg>',
  );

/**
 * Image with a neutral local fallback when the primary source is missing or fails.
 */
export default function SmartImage({
  src,
  fallbackSeed: _fallbackSeed,
  alt = "",
  ...rest
}: SmartImageProps) {
  const resolvedSrc = (src && (apiMediaUrl(src) || src)) || NEUTRAL_PLACEHOLDER;
  const [current, setCurrent] = useState(resolvedSrc);

  useEffect(() => {
    setCurrent(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (current !== NEUTRAL_PLACEHOLDER) setCurrent(NEUTRAL_PLACEHOLDER);
      }}
      {...rest}
    />
  );
}
