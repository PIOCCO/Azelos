import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import PropertyCard from "../components/PropertyCard";
import SmartImage from "../components/SmartImage";
import SectionHeader from "../components/SectionHeader";
import PageMeta from "../components/PageMeta";
import { ContentBlockGrid } from "../components/ContentBlockGrid";
import { useListings } from "../context/ListingsContext";
import { cities } from "../data/cities";
import { INSTITUTION } from "../config/institution";
import {
  aboutIntro,
  missionPoints,
  regionIntro,
  services,
  faqItems,
} from "../data/institutionalContent";
import { fetchNews, fetchEvents, type NewsArticle, type AssociationEvent } from "../lib/contentApi";
import { formatDate } from "../lib/format";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80";

export default function HomePage() {
  const { t, L, lang } = useLocale();
  const { properties } = useListings();
  const featured = properties.filter((p) => p.featured).slice(0, 4);
  const [newsPreview, setNewsPreview] = useState<NewsArticle[]>([]);
  const [eventsPreview, setEventsPreview] = useState<AssociationEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, e] = await Promise.all([fetchNews(), fetchEvents(true)]);
      if (cancelled) return;
      if (n.data?.articles) setNewsPreview(n.data.articles.slice(0, 3));
      if (e.data?.events) setEventsPreview(e.data.events.slice(0, 2));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroTitle = `${INSTITUTION.shortName.fr} — ${L(INSTITUTION.name)}`;

  return (
    <div className="bg-white">
      <PageMeta title={heroTitle} description={L(INSTITUTION.tagline)} path="/" />

      <section className="relative flex min-h-[560px] items-center sm:min-h-[640px]" aria-labelledby="hero-title">
        <div className="absolute inset-0">
          <SmartImage
            src={HERO_IMAGE}
            fallbackSeed="apio-hero-architecture"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy/90" />
        </div>
        <div className="container-page relative z-10 py-16">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-200">{INSTITUTION.shortName.fr}</p>
          <h1 id="hero-title" className="mt-2 max-w-3xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            {L(INSTITUTION.name)}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">{L(INSTITUTION.tagline)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/a-propos" className="btn border-2 border-white bg-white text-navy-800 hover:bg-white/95">
              {t("inst.hero.ctaAbout")}
            </Link>
            <Link
              to="/membres"
              className="btn border-2 border-white/90 bg-transparent text-white hover:bg-white/10"
            >
              {t("inst.hero.ctaMembers")}
            </Link>
            <Link
              to="/projets"
              className="btn border-2 border-white/90 bg-transparent text-white hover:bg-white/10"
            >
              {t("inst.hero.ctaProjects")}
            </Link>
            <Link
              to="/contact"
              className="btn border-2 border-white/90 bg-transparent text-white hover:bg-white/10"
            >
              {t("inst.hero.ctaContact")}
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16" id="a-propos" aria-labelledby="about-home">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 id="about-home" className="font-display text-2xl font-bold text-navy-900">
              {L(aboutIntro.title)}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-700 sm:text-base">{L(aboutIntro.body)}</p>
            <Link to="/a-propos" className="btn-outline mt-6 inline-flex">
              {t("inst.hero.ctaAbout")}
            </Link>
          </div>
          <ContentBlockGrid items={missionPoints.slice(0, 2)} />
        </div>
      </section>

      <section className="border-y border-ink-100 bg-surface py-14 sm:py-16" aria-labelledby="services-home">
        <div className="container-page">
          <SectionHeader title={t("inst.services.title")} subtitle={t("inst.services.subtitle")} />
          <ContentBlockGrid items={services} />
        </div>
      </section>

      <section className="container-page py-14 sm:py-16" aria-labelledby="region-home">
        <h2 id="region-home" className="font-display text-2xl font-bold text-navy-900">
          {L(regionIntro.title)}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-700">{L(regionIntro.body)}</p>
        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
          {cities.map((c) => (
            <Link
              key={c.id}
              to={`/projets?city=${c.id}`}
              className="flex min-w-[140px] shrink-0 flex-col rounded-xl border border-ink-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
            >
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-900">
                <MapPin size={14} className="text-brand-600" />
                {L(c.name)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-100 bg-white py-14 sm:py-16">
        <div className="container-page">
          <SectionHeader
            title={t("inst.projects.featuredTitle")}
            subtitle={t("inst.projects.featuredSub")}
            to="/projets"
            cta={t("common.viewAll")}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-surface py-14 sm:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader title={t("inst.nav.news")} to="/actualites" cta={t("common.viewAll")} />
            {newsPreview.length === 0 ? (
              <p className="text-sm text-ink-600">{t("inst.news.empty")}</p>
            ) : (
              <ul className="space-y-4">
                {newsPreview.map((a) => (
                  <li key={a.id}>
                    <Link to={`/actualites/${a.slug}`} className="group block rounded-lg border border-ink-200 bg-white p-4 hover:border-brand-300">
                      <time className="text-xs text-ink-500">{formatDate(a.publishedAt, lang)}</time>
                      <p className="mt-1 font-semibold text-ink-900 group-hover:text-brand-700">{L(a.title)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <SectionHeader title={t("inst.nav.events")} to="/evenements" cta={t("common.viewAll")} />
            {eventsPreview.length === 0 ? (
              <p className="text-sm text-ink-600">{t("inst.events.empty")}</p>
            ) : (
              <ul className="space-y-4">
                {eventsPreview.map((e) => (
                  <li key={e.id} className="rounded-lg border border-ink-200 bg-white p-4">
                    <p className="font-semibold text-ink-900">{L(e.title)}</p>
                    <time className="text-xs text-ink-500">{formatDate(e.startsAt, lang)}</time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16" aria-labelledby="faq-home">
        <SectionHeader title={t("inst.faq.title")} to="/faq" cta={t("common.viewMore")} />
        <div className="grid gap-3 md:grid-cols-2">
          {faqItems.slice(0, 2).map((item) => (
            <div key={item.q.fr} className="rounded-xl border border-ink-200 p-4">
              <h3 className="font-semibold text-ink-900">{L(item.q)}</h3>
              <p className="mt-2 text-sm text-ink-600">{L(item.a)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-100 bg-navy py-12 text-center text-white">
        <div className="container-page">
          <h2 className="font-display text-xl font-bold">{t("inst.contact.ctaTitle")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/80">{t("inst.contact.ctaSub")}</p>
          <Link to="/contact" className="btn-primary mt-6 bg-white text-navy-800 hover:bg-brand-50">
            {t("inst.nav.contact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
