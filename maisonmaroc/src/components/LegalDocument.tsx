import type { LegalSection } from "../config/legalTexts";
import { useLocale } from "../lib/useLocale";
import PageHeader from "./PageHeader";
import PageMeta from "./PageMeta";

interface Props {
  title: string;
  metaDescription: string;
  path: string;
  sections: LegalSection[];
}

export default function LegalDocument({ title, metaDescription, path, sections }: Props) {
  const { L } = useLocale();
  return (
    <div className="page-shell">
      <PageMeta title={title} description={metaDescription} path={path} />
      <div className="container-page max-w-3xl">
        <PageHeader title={title} />
        <div className="prose-institutional space-y-8 pb-12">
          {sections.map((section) => (
            <section key={section.heading.fr}>
              <h2 className="text-lg font-bold text-ink-900">{L(section.heading)}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-700">
                {section.paragraphs.map((p) => (
                  <p key={p.fr.slice(0, 40)}>{L(p)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
