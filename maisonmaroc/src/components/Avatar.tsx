import { useEffect, useState } from "react";
import { apiMediaUrl } from "../lib/api";

interface AvatarProps {
  src: string;
  name: string;
  className?: string;
}

export default function Avatar({ src, name, className = "" }: AvatarProps) {
  const resolvedSrc = apiMediaUrl(src) || src;
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=1c2e8f&color=fff&bold=true&size=256`;
  const [current, setCurrent] = useState(resolvedSrc);
  useEffect(() => {
    setCurrent(resolvedSrc || fallback);
  }, [resolvedSrc, name]);
  return (
    <img
      src={current}
      alt={name}
      loading="lazy"
      onError={() => current !== fallback && setCurrent(fallback)}
      className={`object-cover ${className}`}
    />
  );
}
