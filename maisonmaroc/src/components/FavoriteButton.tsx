import { Heart } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";

interface Props {
  propertyId: string;
  className?: string;
  size?: number;
}

export default function FavoriteButton({
  propertyId,
  className = "",
  size = 18,
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(propertyId);
  return (
    <button
      type="button"
      aria-label="favorite"
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(propertyId);
      }}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-700 shadow-sm ring-1 ring-ink-100 backdrop-blur transition hover:scale-105 hover:text-rose-500 ${className}`}
    >
      <Heart
        size={size}
        className={active ? "fill-rose-500 text-rose-500" : ""}
      />
    </button>
  );
}
