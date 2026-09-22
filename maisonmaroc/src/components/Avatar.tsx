import { useState } from "react";

interface AvatarProps {
  src: string;
  name: string;
  className?: string;
}

export default function Avatar({ src, name, className = "" }: AvatarProps) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=1c2e8f&color=fff&bold=true&size=256`;
  const [current, setCurrent] = useState(src);
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
