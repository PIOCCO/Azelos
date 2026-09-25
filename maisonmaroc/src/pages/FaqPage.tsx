import { faqItems } from "../data/institutionalContent";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import { useLocale } from "../lib/useLocale";

export default function FaqPage() {
  const { t, L } = useLocale();
  return (
    <div className="page-shell pb-16">
      <PageMeta title={t("inst.faq.metaTitle")} description={t("inst.faq.description")} path="/faq" />
      <div className="container-page max-w-3xl">
        <PageHeader title={t("inst.faq.title")} description={t("inst.faq.description")} />
        <div className="space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.q.fr}
              className="group rounded-xl border border-ink-200 bg-white p-4 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden">
                {L(item.q)}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{L(item.a)}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
