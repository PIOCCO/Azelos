import type { ContentBlock } from "../data/institutionalContent";
import { useLocale } from "../lib/useLocale";

export function ContentBlockGrid({ items }: { items: ContentBlock[] }) {
  const { L } = useLocale();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title.fr}
          className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm"
        >
          <h3 className="font-display text-base font-bold text-navy-800">{L(item.title)}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{L(item.body)}</p>
        </article>
      ))}
    </div>
  );
}
