import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  aboutIntro,
  missionPoints,
  roleOfAssociation,
  regionIntro,
  services,
} from "../data/institutionalContent";
import AboutContentCard from "../components/about/AboutContentCard";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import { INSTITUTION } from "../config/institution";
import { ABOUT_FR } from "../data/aboutCopy.fr";

const SERVICE_LINKS: Record<string, string> = {
  "Annuaire des membres": "/membres",
  "Projets immobiliers": "/projets",
  "Actualités & annonces": "/actualites",
  Événements: "/evenements",
  Publications: "/documents",
};

export default function AboutPage() {
  const intro = aboutIntro.body.fr;
  const metaDesc = intro.length > 160 ? `${intro.slice(0, 157)}…` : intro;

  return (
    <div className="page-shell bg-[#faf9f7] pb-16">
      <PageMeta title={ABOUT_FR.metaTitle} description={metaDesc} path="/a-propos" />

      <div className="home-container max-w-6xl">
        <PageHeader
          title={ABOUT_FR.title}
          description={
            <p className="max-w-3xl text-base leading-relaxed text-ink-600">{ABOUT_FR.introLead}</p>
          }
        />

        <section className="mt-10 rounded-2xl border border-ink-200/80 bg-white p-6 sm:p-10" aria-labelledby="about-who">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">{INSTITUTION.shortName.fr}</p>
          <h2 id="about-who" className="home-section-title mt-2 text-2xl">
            {aboutIntro.title.fr}
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-ink-700">{intro}</p>
        </section>

        <section className="mt-14" aria-labelledby="about-mission">
          <h2 id="about-mission" className="home-section-title">
            {ABOUT_FR.missionTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">{ABOUT_FR.missionSubtitle}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {missionPoints.map((item) => (
              <li key={item.title.fr}>
                <AboutContentCard title={item.title.fr}>{item.body.fr}</AboutContentCard>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="mt-14 rounded-2xl border border-navy/15 bg-navy p-6 text-white sm:p-8"
          aria-labelledby="about-role"
        >
          <h2 id="about-role" className="font-serif text-xl font-semibold sm:text-2xl">
            {roleOfAssociation.title.fr}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base">
            {roleOfAssociation.body.fr}
          </p>
        </section>

        <section className="mt-14" aria-labelledby="about-region">
          <h2 id="about-region" className="home-section-title">
            {regionIntro.title.fr}
          </h2>
          <p className="mt-2 text-sm text-ink-600">{ABOUT_FR.regionSubtitle}</p>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-ink-700 sm:text-base">{regionIntro.body.fr}</p>
          <Link to="/" className="home-text-link mt-6 inline-flex items-center gap-1 text-sm">
            {ABOUT_FR.regionTitle} <ArrowRight size={16} />
          </Link>
        </section>

        <section className="mt-14" aria-labelledby="about-services">
          <h2 id="about-services" className="home-section-title">
            {ABOUT_FR.servicesTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">{ABOUT_FR.servicesSubtitle}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((item) => {
              const href = SERVICE_LINKS[item.title.fr];
              return (
                <li key={item.title.fr}>
                  <AboutContentCard
                    title={item.title.fr}
                    action={
                      href ? (
                        <Link to={href} className="home-text-link inline-flex items-center gap-1 text-xs">
                          {href === "/actualites" ? ABOUT_FR.learnMoreNews : "Accéder"} <ArrowRight size={14} />
                        </Link>
                      ) : undefined
                    }
                  >
                    {item.body.fr}
                  </AboutContentCard>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          className="mt-14 rounded-2xl border border-ink-200 bg-white p-6 sm:p-8"
          aria-labelledby="about-cta"
        >
          <h2 id="about-cta" className="home-section-title text-xl">
            {ABOUT_FR.ctaTitle}
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/membres" className="home-btn home-btn-primary">
              {ABOUT_FR.ctaMembers}
            </Link>
            <Link to="/projets" className="home-btn home-btn-outline">
              {ABOUT_FR.ctaProjects}
            </Link>
            <Link to="/actualites" className="home-btn home-btn-outline">
              {ABOUT_FR.ctaNews}
            </Link>
            <Link to="/documents" className="home-btn home-btn-outline">
              {ABOUT_FR.ctaDocuments}
            </Link>
            <Link to="/contact" className="home-btn home-btn-outline">
              {ABOUT_FR.ctaContact}
            </Link>
          </div>
          <p className="mt-8 text-xs leading-relaxed text-ink-500">{ABOUT_FR.disclaimer}</p>
          <p className="mt-2 text-xs text-ink-400">
            {INSTITUTION.shortName.fr} — {INSTITUTION.name.fr}
          </p>
        </section>
      </div>
    </div>
  );
}
