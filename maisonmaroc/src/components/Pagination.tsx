import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "../lib/useLocale";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  const { isRTL } = useLocale();
  if (totalPages <= 1) return null;
  const Prev = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-600 disabled:opacity-40 hover:border-brand-300"
      >
        <Prev size={18} />
      </button>
      {Array.from({ length: totalPages }).map((_, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
              n === page
                ? "bg-brand-600 text-white"
                : "border border-ink-200 text-ink-600 hover:border-brand-300"
            }`}
          >
            {n}
          </button>
        );
      })}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-ink-600 disabled:opacity-40 hover:border-brand-300"
      >
        <Next size={18} />
      </button>
    </div>
  );
}
