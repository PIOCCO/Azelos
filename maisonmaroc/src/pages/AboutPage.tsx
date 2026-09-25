import { Link } from "react-router-dom";
import {
  aboutIntro,
  missionPoints,
  roleOfAssociation,
  regionIntro,
  services,
} from "../data/institutionalContent";
import { ContentBlockGrid } from "../components/ContentBlockGrid";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import SectionHeader from "../components/SectionHeader";
import { useLocale } from "../lib/useLocale";
import { INSTITUTION } from "../config/institution";

export default function AboutPage() {
  const { t, L } = useLocale();
  return (
    <div className="page-shell bg-white">
      <PageMeta title={t("inst.about.metaTitle")} description={L(aboutIntro.body)} path="/a-propos" />
      <div className="container-page space-y-14 pb-16">
        <PageHeader
          title={t("inst.about.title")}
          description={
            <p className="max-w-3xl text-base leading-relaxed text-ink-600">{L(aboutIntro.body)}</p>
          }
        />

        <section aria-labelledby="mission-heading">
          <SectionHeader title={t("inst.mission.title")} subtitle={t("inst.mission.subtitle")} />
          <ContentBlockGrid items={missionPoints} />
        </section>

        <section className="rounded-2xl border border-ink-200 bg-surface p-6 sm:p-8" aria-labelledby="role-heading">
          <h2 id="role-heading" className="font-display text-xl font-bold text-navy-800">
            {L(roleOfAssociation.title)}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-700">{L(roleOfAssociation.body)}</p>
        </section>

        <section aria-labelledby="region-heading">
          <SectionHeader title={L(regionIntro.title)} subtitle={t("inst.region.subtitle")} />
          <p className="max-w-3xl text-sm leading-relaxed text-ink-700">{L(regionIntro.body)}</p>
        </section>

        <section aria-labelledby="services-heading">
          <SectionHeader title={t("inst.services.title")} subtitle={t("inst.services.subtitle")} />
          <ContentBlockGrid items={services} />
        </section>

        <div className="flex flex-wrap gap-3 border-t border-ink-100 pt-8">
          <Link to="/membres" className="btn-primary">
            {t("inst.hero.ctaMembers")}
          </Link>
          <Link to="/projets" className="btn-outline">
            {t("inst.hero.ctaProjects")}
          </Link>
          <Link to="/contact" className="btn-outline">
            {t("inst.nav.contact")}
          </Link>
        </div>

        <p className="text-xs text-ink-500">
          {INSTITUTION.shortName.fr} — {L(INSTITUTION.name)}
        </p>
      </div>
    </div>
  );
}
