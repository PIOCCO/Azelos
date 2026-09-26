import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocale } from "../../lib/useLocale";
import { NEWS_CATEGORY_IDS, newsCategoryLabel } from "../../lib/newsCategories";
import {
  type AdminDocumentRow,
  type AdminEventRow,
  type AdminNewsRow,
  archiveAdminNews,
  deleteAdminDocument,
  deleteAdminEvent,
  deleteAdminNews,
  fetchAdminDocuments,
  fetchAdminEvents,
  fetchAdminNews,
  saveAdminDocument,
  saveAdminEvent,
  saveAdminNews,
  uploadAdminDocumentFile,
} from "../../lib/adminContentApi";

type Tab = "news" | "events" | "documents";

const emptyNews = (): Partial<AdminNewsRow> & { bodyFr: string; bodyAr: string } => ({
  slug: "",
  titleFr: "",
  titleAr: "",
  summaryFr: "",
  summaryAr: "",
  bodyFr: "",
  bodyAr: "",
  imageUrl: "",
  author: "APIO",
  published: false,
  archived: false,
  featured: false,
  category: "association",
});

export default function AdminContentPanels() {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("news");
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "news", label: t("adminDash.tabNews") },
    { id: "events", label: t("adminDash.tabEvents") },
    { id: "documents", label: t("adminDash.tabDocuments") },
  ];

  return (
    <section className="mt-10">
      <div className="flex flex-wrap gap-2 border-b border-ink-200 pb-2">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              tab === tb.id ? "bg-brand-700 text-white" : "bg-ink-50 text-ink-700 hover:bg-ink-100"
            }`}
            onClick={() => {
              setTab(tb.id);
              setError(null);
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {tab === "news" && <AdminNewsPanel onError={setError} />}
      {tab === "events" && <AdminEventsPanel onError={setError} />}
      {tab === "documents" && <AdminDocumentsPanel onError={setError} />}
    </section>
  );
}

function AdminNewsPanel({ onError }: { onError: (m: string | null) => void }) {
  const { t, lang } = useLocale();
  const [rows, setRows] = useState<AdminNewsRow[]>([]);
  const [editing, setEditing] = useState<(Partial<AdminNewsRow> & { bodyFr: string; bodyAr: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchAdminNews();
    if (res.error) onError(res.error);
    else setRows(res.data?.articles ?? []);
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setIsNew(true);
    setEditing(emptyNews());
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    onError(null);
    const payload = {
      ...editing,
      imageUrl: editing.imageUrl || null,
      published: Boolean(editing.published),
    };
    const res = await saveAdminNews(
      payload as Parameters<typeof saveAdminNews>[0],
      isNew,
    );
    if (res.error) onError(res.error);
    else {
      setEditing(null);
      load();
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between gap-2">
        <h2 className="text-lg font-bold">{t("adminDash.newsTitle")}</h2>
        <button type="button" className="btn-primary btn-sm inline-flex gap-1" onClick={openNew}>
          <Plus size={16} /> {t("adminDash.createNews")}
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl border border-ink-200 bg-surface p-4 sm:grid-cols-2">
          <input className="input sm:col-span-2" required placeholder="slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} dir="ltr" />
          <input className="input" required placeholder={t("adminDash.titleFr")} value={editing.titleFr || ""} onChange={(e) => setEditing({ ...editing, titleFr: e.target.value })} />
          <input className="input" required placeholder={t("adminDash.titleAr")} value={editing.titleAr || ""} onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })} />
          <textarea className="input sm:col-span-2" rows={2} placeholder={t("adminDash.summaryFr")} value={editing.summaryFr || ""} onChange={(e) => setEditing({ ...editing, summaryFr: e.target.value })} />
          <textarea className="input sm:col-span-2" rows={2} placeholder={t("adminDash.summaryAr")} value={editing.summaryAr || ""} onChange={(e) => setEditing({ ...editing, summaryAr: e.target.value })} />
          <textarea className="input sm:col-span-2" required rows={4} placeholder={t("adminDash.bodyFr")} value={editing.bodyFr} onChange={(e) => setEditing({ ...editing, bodyFr: e.target.value })} />
          <textarea className="input sm:col-span-2" required rows={4} placeholder={t("adminDash.bodyAr")} value={editing.bodyAr} onChange={(e) => setEditing({ ...editing, bodyAr: e.target.value })} />
          <input className="input sm:col-span-2" placeholder={t("adminDash.coverUrl")} value={editing.imageUrl || ""} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} dir="ltr" />
          <input className="input" placeholder={t("inst.news.author")} value={editing.author || ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
          <select
            className="input"
            value={editing.category || "association"}
            onChange={(e) => setEditing({ ...editing, category: e.target.value })}
          >
            {NEWS_CATEGORY_IDS.map((id) => (
              <option key={id} value={id}>
                {newsCategoryLabel(id, lang)}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="datetime-local"
            value={editing.publishedAt?.slice(0, 16) || ""}
            onChange={(e) =>
              setEditing({
                ...editing,
                publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(editing.featured)} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
            {t("adminDash.featured")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(editing.published)} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
            {t("adminDash.published")}
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary">{t("common.saveChanges")}</button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t("common.cancel")}</button>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-ink-100">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-50 text-start">
            <tr>
              <th className="px-3 py-2">{t("adminDash.titleFr")}</th>
              <th className="px-3 py-2">slug</th>
              <th className="px-3 py-2">{t("adminDash.status")}</th>
              <th className="px-3 py-2">{t("adminDash.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-medium">{r.titleFr}</td>
                <td className="px-3 py-2" dir="ltr">{r.slug}</td>
                <td className="px-3 py-2">{r.archived ? t("adminDash.archived") : r.published ? t("adminDash.published") : t("adminDash.draft")}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="text-brand-700" onClick={() => { setIsNew(false); setEditing({ ...r }); }} aria-label="edit"><Pencil size={16} /></button>
                    {r.published && !r.archived && (
                      <Link to={`/actualites/${r.slug}`} className="text-ink-600" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /></Link>
                    )}
                    {!r.archived && (
                      <button type="button" className="text-ink-600" onClick={async () => { await archiveAdminNews(r.id); load(); }}>{t("adminDash.archive")}</button>
                    )}
                    <button type="button" className="text-red-600" onClick={async () => { if (confirm(t("adminDash.confirmDelete"))) { await deleteAdminNews(r.id); load(); } }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminEventsPanel({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useLocale();
  const [rows, setRows] = useState<AdminEventRow[]>([]);
  const [editing, setEditing] = useState<Partial<AdminEventRow> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchAdminEvents();
    if (res.error) onError(res.error);
    else setRows(res.data?.events ?? []);
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    onError(null);
    const res = await saveAdminEvent(
      {
        ...editing,
        startsAt: editing.startsAt,
        published: Boolean(editing.published),
      },
      isNew,
      editing.id,
    );
    if (res.error) onError(res.error);
    else {
      setEditing(null);
      load();
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">{t("adminDash.eventsTitle")}</h2>
        <button type="button" className="btn-primary btn-sm" onClick={() => { setIsNew(true); setEditing({ titleFr: "", titleAr: "", startsAt: new Date().toISOString(), published: false }); }}>
          <Plus size={16} /> {t("adminDash.createEvent")}
        </button>
      </div>
      {editing && (
        <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <input className="input" required value={editing.titleFr || ""} onChange={(e) => setEditing({ ...editing, titleFr: e.target.value })} placeholder={t("adminDash.titleFr")} />
          <input className="input" required value={editing.titleAr || ""} onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })} placeholder={t("adminDash.titleAr")} />
          <input className="input sm:col-span-2" type="datetime-local" required value={editing.startsAt?.slice(0, 16) || ""} onChange={(e) => setEditing({ ...editing, startsAt: new Date(e.target.value).toISOString() })} />
          <input className="input" value={editing.locationFr || ""} onChange={(e) => setEditing({ ...editing, locationFr: e.target.value })} placeholder={t("adminDash.locationFr")} />
          <input className="input" value={editing.locationAr || ""} onChange={(e) => setEditing({ ...editing, locationAr: e.target.value })} placeholder={t("adminDash.locationAr")} />
          <textarea className="input sm:col-span-2" rows={3} value={editing.descriptionFr || ""} onChange={(e) => setEditing({ ...editing, descriptionFr: e.target.value })} placeholder={t("adminDash.descriptionFr")} />
          <textarea className="input sm:col-span-2" rows={3} value={editing.descriptionAr || ""} onChange={(e) => setEditing({ ...editing, descriptionAr: e.target.value })} placeholder={t("adminDash.descriptionAr")} />
          <input className="input" value={editing.organizer || ""} onChange={(e) => setEditing({ ...editing, organizer: e.target.value })} placeholder={t("adminDash.organizer")} />
          <input className="input" value={editing.contactInfo || ""} onChange={(e) => setEditing({ ...editing, contactInfo: e.target.value })} placeholder={t("adminDash.contactInfo")} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={Boolean(editing.published)} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
            {t("adminDash.published")}
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary">{t("common.saveChanges")}</button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t("common.cancel")}</button>
          </div>
        </form>
      )}
      <ul className="mt-4 space-y-2">
        {rows.map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="font-medium">{ev.titleFr}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setIsNew(false); setEditing({ ...ev }); }}><Pencil size={16} /></button>
              <button type="button" className="text-red-600" onClick={async () => { if (confirm(t("adminDash.confirmDelete"))) { await deleteAdminEvent(ev.id); load(); } }}><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminDocumentsPanel({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useLocale();
  const [rows, setRows] = useState<AdminDocumentRow[]>([]);
  const [editing, setEditing] = useState<Partial<AdminDocumentRow> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchAdminDocuments();
    if (res.error) onError(res.error);
    else setRows(res.data?.documents ?? []);
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    onError(null);
    const res = await saveAdminDocument(
      {
        category: editing.category || "institutionnel",
        titleFr: editing.titleFr,
        titleAr: editing.titleAr,
        descriptionFr: editing.descriptionFr,
        descriptionAr: editing.descriptionAr,
        visibility: editing.visibility || "public",
        published: Boolean(editing.published),
        docAvailability: editing.availability || "coming_soon",
      },
      isNew,
      editing.id,
    );
    if (res.error) onError(res.error);
    else {
      setEditing(null);
      load();
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">{t("adminDash.documentsTitle")}</h2>
        <button type="button" className="btn-primary btn-sm" onClick={() => { setIsNew(true); setEditing({ category: "institutionnel", titleFr: "", titleAr: "", visibility: "public", published: false, availability: "coming_soon" }); }}>
          <Plus size={16} /> {t("adminDash.createDocument")}
        </button>
      </div>
      {editing && (
        <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <select className="input" value={editing.category || "institutionnel"} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
            {["institutionnel", "membres", "professionnel", "administratif", "juridique"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="input" value={editing.visibility || "public"} onChange={(e) => setEditing({ ...editing, visibility: e.target.value })}>
            <option value="public">public</option>
            <option value="members">members</option>
            <option value="admin">admin</option>
          </select>
          <select className="input" value={editing.availability || "coming_soon"} onChange={(e) => setEditing({ ...editing, availability: e.target.value })}>
            <option value="coming_soon">coming_soon</option>
            <option value="template">template</option>
            <option value="online">online</option>
            <option value="available">available</option>
          </select>
          <input className="input" required value={editing.titleFr || ""} onChange={(e) => setEditing({ ...editing, titleFr: e.target.value })} placeholder={t("adminDash.titleFr")} />
          <input className="input" required value={editing.titleAr || ""} onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })} placeholder={t("adminDash.titleAr")} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={Boolean(editing.published)} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
            {t("adminDash.published")}
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary">{t("common.saveChanges")}</button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t("common.cancel")}</button>
          </div>
        </form>
      )}
      <ul className="mt-4 space-y-3">
        {rows.map((doc) => (
          <li key={doc.id} className="rounded-lg border px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{doc.titleFr}</p>
                <p className="text-xs text-ink-500">{doc.category} · {doc.visibility} · {doc.published ? t("adminDash.published") : t("adminDash.draft")}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setIsNew(false); setEditing({ ...doc }); }}><Pencil size={16} /></button>
                <button type="button" className="text-red-600" onClick={async () => { if (confirm(t("adminDash.confirmDelete"))) { await deleteAdminDocument(doc.id); load(); } }}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploadId(doc.id);
                onError(null);
                const res = await uploadAdminDocumentFile(doc.id, f);
                setUploadId(null);
                if (res.error) onError(res.error);
                else load();
              }} />
              {uploadId === doc.id && <span className="text-xs">{t("common.loading")}</span>}
              {doc.fileStorage && <span className="text-xs text-green-700">{t("adminDash.fileAttached")}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
