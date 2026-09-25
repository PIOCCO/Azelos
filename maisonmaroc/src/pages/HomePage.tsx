import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  FileText,
  Handshake,
  MapPin,
  Megaphone,
  Users,
} from "lucide-react";
import HomeHeader from "../components/home/HomeHeader";
import HomeFooter from "../components/home/HomeFooter";
import SmartImage from "../components/SmartImage";
import Avatar from "../components/Avatar";
import PageMeta from "../components/PageMeta";
import { useLocale } from "../lib/useLocale";
import { useListings } from "../context/ListingsContext";
import { INSTITUTION } from "../config/institution";
import {
  aboutIntro,
  faqItems,
  missionPoints,
  regionIntro,
  roleOfAssociation,
} from "../data/institutionalContent";
import { cities, cityById } from "../data/cities";
import { fetchDocuments, fetchEvents, fetchNews, type AssociationEvent, type NewsArticle, type PublicDocument } from "../lib/contentApi";
import { formatDate } from "../lib/format";
import OrientalMap from "../components/home/OrientalMap";
import HomeHeroMedia from "../components/home/HomeHeroMedia";
import { HOME_HERO_IMAGES } from "../components/home/homeHeroImages";
const MOSAIC = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  cities[0]?.image,
  cities[2]?.image || cities[1]?.image,
];
const REGION_LEFT = [
  cities[1]?.image || MOSAIC[0],
  cities[0]?.image || MOSAIC[1],
];
const REGION_RIGHT = {
  tall: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
  small: [
    cities[3]?.image || MOSAIC[2],
    cities[4]?.image || MOSAIC[0],
  ],
};
const CTA_BG =
  "https://images.unsplash.com/photo-1518548419970-58e985b0a4a2?auto=format&fit=crop&w=1920&q=80";

const MISSION_ICONS = [Users, Handshake, Megaphone, Building2, Building2];

export default function HomePage() {
  const { t, L, lang } = useLocale();
  const { properties, owners } = useListings();
  const featured = properties.filter((p) => p.featured).slice(0, 4);
  const members = [...owners].slice(0, 4);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<AssociationEvent[]>([]);
  const [docs, setDocs] = useState<PublicDocument[]>([]);

  const missionItems = [
    ...missionPoints,
    { title: roleOfAssociation.title, body: { fr: roleOfAssociation.body.fr.slice(0, 120) + "…", ar: roleOfAssociation.body.ar.slice(0, 120) + "…" } },
  ].slice(0, 5);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, e, d] = await Promise.all([fetchNews(), fetchEvents(true), fetchDocuments()]);
      if (cancelled) return;
      if (n.data?.articles) setNews(n.data.articles.slice(0, 2));
      if (e.data?.events) setEvents(e.data.events.slice(0, 2));
      if (d.data?.documents) setDocs(d.data.documents.slice(0, 4));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home-page bg-[#faf9f7]">
      <PageMeta title={`${INSTITUTION.shortName.fr} — ${L(INSTITUTION.name)}`} description={L(INSTITUTION.tagline)} path="/" />
      <HomeHeader />

      {/* Hero */}
      <section className="home-hero" aria-label={t("homePage.nav.home")}>
        <HomeHeroMedia images={[...HOME_HERO_IMAGES]} alt={L(INSTITUTION.name)} />
        <div className="home-hero-overlay" aria-hidden />
        <div className="home-container home-hero-content">
          <p className="home-hero-kicker">{INSTITUTION.shortName.fr}</p>
          <h1 className="home-display-title home-hero-title mt-3">{L(INSTITUTION.name)}</h1>
          <p className="home-hero-lead mt-5 max-w-lg text-base leading-relaxed">{L(INSTITUTION.tagline)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/a-propos" className="home-btn home-btn-primary">
              {t("homePage.hero.ctaAbout")}
            </Link>
            <Link to="/membres" className="home-btn home-btn-hero-outline">
              {t("homePage.hero.ctaMembers")}
            </Link>
            <Link to="/projets" className="home-btn home-btn-hero-outline">
              {t("homePage.hero.ctaProjects")}
            </Link>
            <Link to="/contact" className="home-btn home-btn-hero-outline">
              {t("homePage.hero.ctaContact")}
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="home-section bg-white">
        <div className="home-container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="home-section-title">{t("homePage.about.title")}</h2>
            <p className="mt-6 text-sm leading-relaxed text-ink-600">{L(aboutIntro.body)}</p>
            <div className="mt-8 space-y-6 border-s-2 border-navy/20 ps-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-navy">{t("homePage.about.missionLabel")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{L(missionPoints[0]?.body)}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-navy">{L(roleOfAssociation.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{L(roleOfAssociation.body)}</p>
              </div>
            </div>
            <Link to="/a-propos" className="home-text-link mt-8 inline-flex items-center gap-1">
              {t("homePage.about.readMore")} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="home-mosaic grid grid-cols-2 gap-3">
            <SmartImage src={MOSAIC[0]} alt="" className="col-span-2 h-48 w-full object-cover sm:h-56" fallbackSeed="m1" />
            <SmartImage src={MOSAIC[1]} alt="" className="h-40 w-full object-cover" fallbackSeed="m2" />
            <SmartImage src={MOSAIC[2]} alt="" className="h-40 w-full object-cover" fallbackSeed="m3" />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="home-section home-mission-section">
        <div className="home-container">
          <h2 className="home-section-title">{t("homePage.mission.title")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            {missionItems.map((item, i) => {
              const Icon = MISSION_ICONS[i] || Building2;
              return (
                <article key={item.title.fr} className="home-mission-card">
                  <Icon className="h-7 w-7 text-navy" strokeWidth={1.25} />
                  <h3 className="mt-4 text-sm font-bold leading-snug text-navy">{L(item.title)}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500 line-clamp-3">{L(item.body)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Region */}
      <section className="home-section bg-white">
        <div className="home-container">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
            <div className="lg:col-span-4 xl:col-span-3">
              <h2 className="home-section-title max-w-sm">{t("homePage.region.immobilierTitle")}</h2>
              <p className="mt-5 text-sm leading-relaxed text-ink-600">{L(regionIntro.body)}</p>
              <div className="mt-8 hidden flex-col gap-4 lg:flex">
                {REGION_LEFT.map((src, idx) => (
                  <div key={idx} className="home-region-photo aspect-[4/5] max-h-[220px]">
                    <SmartImage src={src} alt="" className="h-full w-full object-cover" fallbackSeed={`reg-l-${idx}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 xl:col-span-5 lg:pt-2">
              <OrientalMap />
              <ul className="mt-6 flex flex-wrap gap-2 lg:justify-center">
                {cities.map((c) => (
                  <li key={c.id}>
                    <Link to={`/projets?city=${c.id}`} className="home-chip">
                      {L(c.name)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden flex-col gap-4 lg:col-span-4 lg:flex xl:col-span-4">
              <div className="home-region-photo aspect-[3/5] min-h-[280px] flex-1">
                <SmartImage
                  src={REGION_RIGHT.tall}
                  alt=""
                  className="h-full w-full object-cover"
                  fallbackSeed="reg-r-tall"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {REGION_RIGHT.small.map((src, idx) => (
                  <div key={idx} className="home-region-photo aspect-[3/4]">
                    <SmartImage src={src} alt="" className="h-full w-full object-cover" fallbackSeed={`reg-r-${idx}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:hidden">
            {[REGION_LEFT[0], REGION_LEFT[1], REGION_RIGHT.tall, REGION_RIGHT.small[0]].map((src, idx) => (
              <div key={idx} className="home-region-photo aspect-[3/4]">
                <SmartImage src={src} alt="" className="h-full w-full object-cover" fallbackSeed={`reg-m-${idx}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="home-section">
        <div className="home-container">
          <h2 className="home-section-title text-center">{t("homePage.members.title")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink-500">{t("homePage.members.sub")}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((o) => {
              const city = cityById(o.cityId);
              return (
                <article key={o.id} className="home-member-card">
                  <Avatar src={o.avatar} name={L(o.name)} className="mx-auto h-14 w-14 rounded-full" />
                  <h3 className="mt-4 text-center text-sm font-bold text-ink-900">{L(o.name)}</h3>
                  <p className="mt-1 flex items-center justify-center gap-1 text-xs text-ink-500">
                    <MapPin size={12} /> {city ? L(city.name) : "—"}
                  </p>
                  <p className="mt-3 line-clamp-2 text-center text-xs leading-relaxed text-ink-500">{L(o.bio)}</p>
                  <Link to={`/agent/${o.id}`} className="home-text-link mx-auto mt-4 block text-center text-xs">
                    {t("common.seeProfile")}
                  </Link>
                </article>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link to="/membres" className="home-btn home-btn-primary">
              {t("homePage.members.viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="home-section bg-white">
        <div className="home-container">
          <h2 className="home-section-title text-center">{t("homePage.projects.title")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => {
              const city = cityById(p.cityId);
              return (
                <Link key={p.id} to={`/property/${p.slug}`} className="home-project-card group">
                  <SmartImage
                    src={p.images[0]}
                    fallbackSeed={p.id}
                    alt={L(p.title)}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="home-project-overlay">
                    <h3 className="font-serif text-lg text-white">{L(p.title)}</h3>
                    <p className="mt-1 text-xs text-white/80">{city ? L(city.name) : ""}</p>
                    <span className="home-text-link-light mt-3 inline-flex items-center gap-1 text-xs">
                      {t("homePage.projects.view")} <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link to="/projets" className="home-btn home-btn-outline">
              {t("homePage.projects.viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* News & Events */}
      <section className="home-section">
        <div className="home-container grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="home-section-title">{t("homePage.news.title")}</h2>
            {news.length === 0 ? (
              <p className="mt-4 text-sm text-ink-500">{t("inst.news.empty")}</p>
            ) : (
              <ul className="mt-6 space-y-4">
                {news.map((a) => (
                  <li key={a.id}>
                    <Link to={`/actualites/${a.slug}`} className="home-news-row group">
                      {a.imageUrl ? (
                        <SmartImage src={a.imageUrl} alt="" className="h-20 w-24 shrink-0 object-cover" fallbackSeed={a.slug} />
                      ) : (
                        <div className="grid h-20 w-24 shrink-0 place-items-center bg-ink-100 text-ink-400">
                          <Megaphone size={24} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <time className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                          {formatDate(a.publishedAt, lang)}
                        </time>
                        <p className="mt-1 font-semibold text-ink-900 group-hover:text-navy">{L(a.title)}</p>
                        {L(a.summary) && <p className="mt-1 line-clamp-2 text-xs text-ink-500">{L(a.summary)}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/actualites" className="home-btn home-btn-outline mt-8">
              {t("homePage.news.viewAll")}
            </Link>
          </div>
          <div>
            <h2 className="home-section-title">{t("homePage.events.title")}</h2>
            {events.length === 0 ? (
              <p className="mt-4 text-sm text-ink-500">{t("inst.events.empty")}</p>
            ) : (
              <ul className="mt-6 space-y-4">
                {events.map((ev) => {
                  const d = new Date(ev.startsAt);
                  return (
                    <li key={ev.id} className="home-event-card">
                      <div className="home-event-date">
                        <span className="text-2xl font-bold leading-none text-navy">{d.getDate()}</span>
                        <span className="text-[10px] font-bold uppercase text-ink-500">
                          {d.toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR", { month: "short" })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900">{L(ev.title)}</p>
                        <p className="mt-1 text-xs text-ink-500">{L(ev.location) || formatDate(ev.startsAt, lang)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link to="/evenements" className="home-btn home-btn-outline mt-8">
              {t("homePage.events.viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="home-section bg-white">
        <div className="home-container">
          <h2 className="home-section-title text-center">{t("homePage.documents.title")}</h2>
          {docs.length === 0 ? (
            <p className="mt-6 text-center text-sm text-ink-500">{t("inst.documents.empty")}</p>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {docs.map((doc) => (
                <article key={doc.id} className="home-doc-card">
                  <FileText className="h-8 w-8 text-navy/70" strokeWidth={1.25} />
                  <h3 className="mt-4 text-sm font-bold text-ink-900">{L(doc.title)}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wide text-ink-400">{doc.category}</p>
                  <time className="mt-2 block text-xs text-ink-500">{formatDate(doc.publishedAt, lang)}</time>
                </article>
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <Link to="/documents" className="home-btn home-btn-primary">
              {t("homePage.documents.viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section">
        <div className="home-container">
          <h2 className="home-section-title text-center">{t("homePage.faq.title")}</h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 md:grid-cols-2">
            {faqItems.map((item) => (
              <details key={item.q.fr} className="home-faq">
                <summary>{L(item.q)}</summary>
                <p>{L(item.a)}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/faq" className="home-text-link inline-flex items-center gap-1">
              {t("homePage.faq.viewAll")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <SmartImage src={CTA_BG} alt="" className="absolute inset-0 h-full w-full object-cover" fallbackSeed="cta" />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="home-container relative py-20 text-center">
          <h2 className="home-display-title home-cta-headline mx-auto max-w-2xl">{t("homePage.cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/75">{t("homePage.cta.sub")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="home-btn border border-white bg-transparent text-white hover:bg-white/10">
              {t("homePage.nav.contact")}
            </Link>
            <Link to="/owner/login" className="home-btn bg-white text-navy hover:bg-white/90">
              {t("homePage.nav.promoter")}
            </Link>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  );
}
