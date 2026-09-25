import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import { fetchEvents, type AssociationEvent } from "../lib/contentApi";
import { formatDate } from "../lib/format";

function EventCard({ event }: { event: AssociationEvent }) {
  const { L, lang } = useLocale();
  const start = new Date(event.startsAt);
  const dateLabel = formatDate(event.startsAt, lang);
  const timeLabel = start.toLocaleTimeString(lang === "ar" ? "ar-MA" : "fr-MA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <article className="rounded-xl border border-ink-200 bg-white p-5">
      <h3 className="font-display text-lg font-bold text-navy-800">{L(event.title)}</h3>
      <ul className="mt-3 space-y-2 text-sm text-ink-600">
        <li className="flex items-start gap-2">
          <Calendar size={16} className="mt-0.5 shrink-0 text-brand-600" />
          <span>
            {dateLabel} — {timeLabel}
          </span>
        </li>
        {L(event.location) && (
          <li className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
            <span>{L(event.location)}</span>
          </li>
        )}
      </ul>
      {L(event.description) && <p className="mt-3 text-sm leading-relaxed text-ink-700">{L(event.description)}</p>}
      {event.organizer && <p className="mt-2 text-xs text-ink-500">{event.organizer}</p>}
      {event.contactInfo && (
        <p className="mt-2 text-xs text-ink-600 whitespace-pre-wrap">{event.contactInfo}</p>
      )}
    </article>
  );
}

export default function EventsPage() {
  const { t } = useLocale();
  const [events, setEvents] = useState<AssociationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchEvents(false);
      if (!cancelled && res.data) setEvents(res.data.events);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const now = Date.now();
  const { upcoming, past } = useMemo(() => {
    const up: AssociationEvent[] = [];
    const pa: AssociationEvent[] = [];
    for (const e of events) {
      if (new Date(e.startsAt).getTime() >= now) up.push(e);
      else pa.push(e);
    }
    up.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    pa.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return { upcoming: up, past: pa };
  }, [events, now]);

  return (
    <div className="page-shell pb-16">
      <PageMeta title={t("inst.events.metaTitle")} description={t("inst.events.description")} path="/evenements" />
      <div className="container-page">
        <PageHeader title={t("inst.nav.events")} description={t("inst.events.description")} />
        {loading && <p>{t("common.loading")}</p>}
        {!loading && events.length === 0 && <p className="text-ink-600">{t("inst.events.empty")}</p>}

        {upcoming.length > 0 && (
          <section className="mb-10" aria-labelledby="upcoming-events">
            <h2 id="upcoming-events" className="mb-4 text-lg font-bold text-ink-900">
              {t("inst.events.upcoming")}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section aria-labelledby="past-events">
            <h2 id="past-events" className="mb-4 text-lg font-bold text-ink-900">
              {t("inst.events.past")}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {past.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
