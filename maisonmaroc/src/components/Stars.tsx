import { Star } from "lucide-react";

interface StarsProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export default function Stars({
  rating,
  size = 16,
  showValue = true,
  className = "",
}: StarsProps) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full || (i === full && hasHalf);
          return (
            <Star
              key={i}
              size={size}
              className={
                filled ? "fill-gold-400 text-gold-400" : "fill-ink-200 text-ink-200"
              }
            />
          );
        })}
      </span>
      {showValue && (
        <span className="text-sm font-semibold text-ink-800">
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
