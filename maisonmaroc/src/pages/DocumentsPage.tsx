import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import { fetchDocuments, type PublicDocument } from "../lib/contentApi";
import { formatDate } from "../lib/format";

export default function DocumentsPage() {
  const { t, L, lang } = useLocale();
  const [docs, setDocs] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchDocuments();
      if (!cancelled && res.data) setDocs(res.data.documents);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell pb-16">
      <PageMeta title={t("inst.documents.metaTitle")} description={t("inst.documents.description")} path="/documents" />
      <div className="container-page max-w-3xl">
        <PageHeader title={t("inst.nav.documents")} description={t("inst.documents.description")} />
        {loading && <p>{t("common.loading")}</p>}
        {!loading && docs.length === 0 && <p className="text-ink-600">{t("inst.documents.empty")}</p>}
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li key={doc.id}>
              <article className="flex gap-4 rounded-xl border border-ink-200 bg-white p-4">
                <FileText className="shrink-0 text-brand-600" size={28} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-ink-900">{L(doc.title)}</h2>
                  <p className="text-xs uppercase tracking-wide text-ink-500">{doc.category}</p>
                  {L(doc.description) && (
                    <p className="mt-1 text-sm text-ink-600">{L(doc.description)}</p>
                  )}
                  <time className="mt-2 block text-xs text-ink-500" dateTime={doc.publishedAt}>
                    {formatDate(doc.publishedAt, lang)}
                  </time>
                  {doc.fileUrl ? (
                    <a
                      href={doc.fileUrl.startsWith("http") ? doc.fileUrl : `${import.meta.env.VITE_API_URL ?? ""}${doc.fileUrl}`}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
                      download
                      rel="noopener noreferrer"
                    >
                      <Download size={14} /> {t("inst.documents.download")}
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-ink-500">{t("inst.documents.noFile")}</p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
