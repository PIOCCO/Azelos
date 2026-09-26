export default function NewsListSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="animate-pulse space-y-10">
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white lg:grid lg:grid-cols-2">
        <div className="min-h-[220px] bg-ink-100 lg:min-h-[320px]" />
        <div className="space-y-4 p-8">
          <div className="h-3 w-24 rounded bg-ink-100" />
          <div className="h-8 w-full max-w-md rounded bg-ink-100" />
          <div className="h-4 w-full rounded bg-ink-100" />
          <div className="h-4 w-5/6 rounded bg-ink-100" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-ink-100 bg-white">
            <div className="aspect-[16/10] bg-ink-100" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-20 rounded bg-ink-100" />
              <div className="h-5 w-full rounded bg-ink-100" />
              <div className="h-4 w-full rounded bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
