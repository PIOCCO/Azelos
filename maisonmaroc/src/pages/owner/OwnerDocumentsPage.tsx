import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { apiFetch } from "../../lib/api";
import type { OwnerDocument } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import { PortalEmpty, PortalError, PortalLoading } from "../../components/owner/PortalStates";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function OwnerDocumentsPage() {
  const { t, L } = useLocale();
  const [documents, setDocuments] = useState<OwnerDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await apiFetch<{ documents: OwnerDocument[] }>("/api/owner/documents");
    setLoading(false);
    if (err) setError(err);
    else setDocuments(data?.documents ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!q.trim()) return documents;
    const qq = q.toLowerCase();
    return documents.filter(
      (d) => d.title.fr.toLowerCase().includes(qq) || d.title.ar.includes(q) || d.category.includes(qq),
    );
  }, [documents, q]);

  const download = (doc: OwnerDocument) => {
    if (!doc.fileUrl) return;
    const url = doc.fileUrl.startsWith("http") ? doc.fileUrl : `${API_BASE}${doc.fileUrl}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.documents")}</h1>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} aria-hidden />
        <input className="input w-full ps-9" placeholder={t("ownerPortal.searchDocuments")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <PortalError message={error} onRetry={load} />}
      {loading && <PortalLoading />}
      {!loading && !error && filtered.length === 0 && (
        <PortalEmpty message={t("ownerPortal.noDocuments")} />
      )}
      {!loading && filtered.length > 0 && (
        <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
          {filtered.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="text-xs font-bold uppercase text-ink-400">{doc.category}</p>
                <p className="font-medium text-ink-900">{L(doc.title)}</p>
                {doc.description?.fr && <p className="mt-1 text-sm text-ink-500">{L(doc.description)}</p>}
              </div>
              {doc.fileUrl ? (
                <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => download(doc)}>
                  <Download size={16} aria-hidden />
                  {t("ownerPortal.download")}
                </button>
              ) : (
                <span className="text-xs text-ink-400">{t("ownerPortal.unavailable")}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
