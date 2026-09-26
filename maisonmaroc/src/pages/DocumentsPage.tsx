import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, FileText, Search } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import { apiRoot } from "../lib/api";
import { fetchDocuments, type PublicDocument } from "../lib/contentApi";
import { formatDate } from "../lib/format";
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_ORDER,
  type DocumentCategoryId,
} from "../data/documentCategories.fr";

const FR = {
  metaTitle: "Centre de documentation — APIO",
  title: "Centre de documentation",
  description:
    "Consultez et téléchargez les documents institutionnels, ressources membres, modèles professionnels et textes réglementaires de l'APIO.",
  loading: "Chargement des documents…",
  empty: "Aucun document public n'est disponible pour le moment.",
  searchPlaceholder: "Rechercher un document…",
  filterAll: "Toutes les catégories",
  badgeComingSoon: "Document à venir",
  badgeTemplate: "Modèle à compléter",
  badgeOnline: "Consultation en ligne",
  downloadPdf: "Télécharger le PDF",
  noFile: "Fichier non disponible — document en préparation.",
  version: "Mise à jour",
  type: "Format",
  errorLoad: "Impossible de charger les documents. Veuillez réessayer plus tard.",
};

function documentDownloadHref(fileUrl: string) {
  return fileUrl.startsWith("http") ? fileUrl : `${apiRoot()}${fileUrl}`;
}

function suggestedPdfFilename(titleFr: string, docId: string) {
  const base = String(titleFr || docId)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const stem = base || docId.slice(0, 40);
  return `${stem}.pdf`;
}

/** Public PDF download only — no preview, no HTML templates, no « à venir ». */
function canDownloadPdf(doc: PublicDocument) {
  if (doc.availability === "coming_soon") return false;
  if (!doc.fileUrl) return false;
  const mime = (doc.fileMime || "").toLowerCase();
  if (mime.includes("pdf")) return true;
  if (doc.fileFormat?.toUpperCase() === "PDF" && !mime.includes("html")) return true;
  return false;
}

function docMatchesSearch(doc: PublicDocument, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    doc.title.fr.toLowerCase().includes(s) ||
    doc.description.fr.toLowerCase().includes(s) ||
    doc.fileFormat.toLowerCase().includes(s)
  );
}

function availabilityBadge(doc: PublicDocument) {
  if (doc.availability === "template") return FR.badgeTemplate;
  if (doc.availability === "online") return FR.badgeOnline;
  if (doc.availability === "coming_soon") return FR.badgeComingSoon;
  return null;
}

const CATEGORY_PARAM = new Set<string>(DOCUMENT_CATEGORY_ORDER);

export default function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const [docs, setDocs] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const initialCategory = searchParams.get("category");
  const [category, setCategory] = useState<DocumentCategoryId | "all">(() =>
    initialCategory && CATEGORY_PARAM.has(initialCategory)
      ? (initialCategory as DocumentCategoryId)
      : "all",
  );

  useEffect(() => {
    const param = searchParams.get("category");
    if (param && CATEGORY_PARAM.has(param)) {
      setCategory(param as DocumentCategoryId);
    } else if (!param) {
      setCategory("all");
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchDocuments();
      if (cancelled) return;
      if (res.error || !res.data) setError(true);
      else setDocs(res.data.documents);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      return docMatchesSearch(d, query);
    });
  }, [docs, category, query]);

  const grouped = useMemo(() => {
    const map = new Map<DocumentCategoryId, PublicDocument[]>();
    for (const id of DOCUMENT_CATEGORY_ORDER) map.set(id, []);
    for (const doc of filtered) {
      const key = doc.category as DocumentCategoryId;
      if (map.has(key)) map.get(key)!.push(doc);
    }
    return DOCUMENT_CATEGORY_ORDER.map((id) => ({ id, label: DOCUMENT_CATEGORY_LABELS[id], items: map.get(id)! })).filter(
      (g) => g.items.length > 0,
    );
  }, [filtered]);

  return (
    <div className="page-shell pb-16">
      <PageMeta title={FR.metaTitle} description={FR.description} path="/documents" />
      <div className="container-page max-w-5xl">
        <PageHeader title={FR.title} description={FR.description} />

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block max-w-md flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={FR.searchPlaceholder}
              className="input w-full ps-10"
              aria-label={FR.searchPlaceholder}
            />
          </label>
          <select
            className="input max-w-xs"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategoryId | "all")}
            aria-label={FR.filterAll}
          >
            <option value="all">{FR.filterAll}</option>
            {DOCUMENT_CATEGORY_ORDER.map((id) => (
              <option key={id} value={id}>
                {DOCUMENT_CATEGORY_LABELS[id]}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="mt-8 text-ink-600">{FR.loading}</p>}
        {error && !loading && <p className="mt-8 text-red-700">{FR.errorLoad}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="mt-8 text-ink-600">{FR.empty}</p>
        )}

        <div className="mt-10 space-y-14">
          {grouped.map((section) => (
            <section key={section.id} aria-labelledby={`doc-cat-${section.id}`}>
              <h2 id={`doc-cat-${section.id}`} className="font-serif text-xl font-semibold text-navy sm:text-2xl">
                {section.label}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {section.items.map((doc) => {
                  const badge = availabilityBadge(doc);
                  const showPdfDownload = canDownloadPdf(doc);

                  return (
                    <li key={doc.id}>
                      <article className="flex h-full flex-col rounded-xl border border-ink-200/90 bg-white p-5 shadow-sm transition hover:border-ink-300">
                        <div className="flex gap-3">
                          <FileText className="mt-0.5 shrink-0 text-navy/70" size={26} strokeWidth={1.25} />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold leading-snug text-ink-900">{doc.title.fr}</h3>
                            {badge && (
                              <span className="mt-2 inline-block rounded-md bg-[#f5f2ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                                {badge}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">{doc.description.fr}</p>
                        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                          <div>
                            <dt className="inline font-semibold text-ink-700">{FR.type} : </dt>
                            <dd className="inline">{doc.fileFormat}</dd>
                          </div>
                          {doc.publishedAt && (
                            <div>
                              <dt className="inline font-semibold text-ink-700">{FR.version} : </dt>
                              <dd className="inline">
                                <time dateTime={doc.publishedAt}>{formatDate(doc.publishedAt, "fr")}</time>
                              </dd>
                            </div>
                          )}
                        </dl>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {showPdfDownload ? (
                            <a
                              href={documentDownloadHref(doc.fileUrl!)}
                              className="home-btn home-btn-outline inline-flex min-h-[40px] border-navy px-4 py-2 text-[11px] text-navy"
                              download={suggestedPdfFilename(doc.title.fr, doc.id)}
                              rel="noopener noreferrer"
                            >
                              <Download size={14} className="me-1.5" aria-hidden /> {FR.downloadPdf}
                            </a>
                          ) : (
                            <span className="text-xs leading-relaxed text-ink-500">{FR.noFile}</span>
                          )}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
