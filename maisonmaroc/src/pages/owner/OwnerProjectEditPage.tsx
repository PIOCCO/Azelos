import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Trash2, Upload } from "lucide-react";
import { apiFetch } from "../../lib/api";
import type { OwnerProjectImage, OwnerProjectListItem } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import { cityById, cities } from "../../data/cities";
import ProjectStatusBadge from "../../components/owner/ProjectStatusBadge";
import { PortalError, PortalLoading, PortalSuccessBanner } from "../../components/owner/PortalStates";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function OwnerProjectEditPage() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { t, L } = useLocale();
  const [project, setProject] = useState<OwnerProjectListItem | null>(null);
  const [images, setImages] = useState<OwnerProjectImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    titleFr: "",
    titleAr: "",
    descriptionFr: "",
    descriptionAr: "",
    cityId: "",
    status: "draft",
  });

  const load = useCallback(async () => {
    if (isNew) return;
    setError(null);
    const { data, error: err } = await apiFetch<{ project: OwnerProjectListItem; images: OwnerProjectImage[] }>(
      `/api/owner/projects/${id}`,
    );
    if (err) setError(err);
    else if (data) {
      setProject(data.project);
      setImages(data.images);
      setForm({
        titleFr: data.project.title.fr,
        titleAr: data.project.title.ar,
        descriptionFr: data.project.description?.fr ?? "",
        descriptionAr: data.project.description?.ar ?? "",
        cityId: data.project.cityId ?? "",
        status: data.project.status,
      });
    }
  }, [id, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: FormEvent, submitPending = false) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    const payload = {
      titleFr: form.titleFr,
      titleAr: form.titleAr,
      descriptionFr: form.descriptionFr,
      descriptionAr: form.descriptionAr,
      cityId: form.cityId || null,
      status: submitPending ? "pending" : form.status === "pending" ? "pending" : form.status,
    };
    if (isNew) {
      const { data, error: err } = await apiFetch<{ project: OwnerProjectListItem }>("/api/owner/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (err) setError(err);
      else if (data?.project?.id) navigate(`/owner/projects/${data.project.id}`, { replace: true });
    } else {
      const { data, error: err } = await apiFetch<{ project: OwnerProjectListItem; images: OwnerProjectImage[] }>(
        `/api/owner/projects/${id}`,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
      if (err) setError(err);
      else if (data) {
        setProject(data.project);
        setSuccess(submitPending ? t("ownerPortal.projectSubmitted") : t("ownerPortal.saved"));
      }
    }
  };

  const removeProject = async () => {
    if (isNew || !id) return;
    if (!confirm(t("ownerPortal.confirmDeleteProject"))) return;
    const { error: err } = await apiFetch(`/api/owner/projects/${id}`, { method: "DELETE" });
    if (err) setError(err);
    else navigate("/owner/projects");
  };

  const onUpload = async (file: File) => {
    if (!id || isNew) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/owner/projects/${id}/images`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setError(typeof body.error === "string" ? body.error : t("ownerPortal.uploadFailed"));
      else setImages(body.images ?? []);
    } catch {
      setError(t("ownerPortal.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    const { error: err } = await apiFetch(`/api/owner/project-images/${imageId}`, { method: "DELETE" });
    if (err) setError(err);
    else setImages((prev) => prev.filter((i) => i.id !== imageId));
  };

  const setPrimary = async (imageId: string) => {
    if (!id) return;
    const { data, error: err } = await apiFetch<{ images: OwnerProjectImage[] }>(`/api/owner/projects/${id}/images`, {
      method: "PATCH",
      body: JSON.stringify({ primaryId: imageId }),
    });
    if (err) setError(err);
    else setImages(data?.images ?? []);
  };

  if (!isNew && !project && !error) {
    return (
      <div>
        <PortalLoading lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/owner/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft size={16} aria-hidden /> {t("ownerPortal.backToProjects")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-navy">{isNew ? t("ownerPortal.newProject") : t("ownerPortal.editProject")}</h1>
        {project && <ProjectStatusBadge status={project.status} />}
      </div>
      {success && <PortalSuccessBanner message={success} />}
      {error && <PortalError message={error} onRetry={isNew ? undefined : load} />}

      <form onSubmit={(e) => save(e, false)} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold">{t("adminDash.titleFr")}</span>
            <input required className="input mt-1" value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">{t("adminDash.titleAr")}</span>
            <input dir="rtl" className="input mt-1" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-semibold">{t("ownerPortal.descriptionFr")}</span>
          <textarea className="input mt-1 min-h-[120px]" value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">{t("ownerPortal.descriptionAr")}</span>
          <textarea dir="rtl" className="input mt-1 min-h-[120px]" value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
        </label>
        <label className="block text-sm sm:max-w-xs">
          <span className="font-semibold">{t("ownerPortal.city")}</span>
          <select className="input mt-1" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
            <option value="">—</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {L(c.name)}
              </option>
            ))}
          </select>
        </label>
        {form.cityId && cityById(form.cityId) && (
          <p className="text-xs text-ink-500">{L(cityById(form.cityId)!.name)}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">
            {t("ownerPortal.saveDraft")}
          </button>
          {!isNew && (
            <button type="button" className="btn-secondary" onClick={(e) => save(e as unknown as FormEvent, true)}>
              {t("ownerPortal.submitForReview")}
            </button>
          )}
          {!isNew && (
            <button type="button" className="btn-secondary text-red-700" onClick={removeProject}>
              <Trash2 size={16} className="inline" aria-hidden /> {t("adminDash.delete")}
            </button>
          )}
        </div>
      </form>

      {!isNew && id && (
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy">{t("ownerPortal.projectImages")}</h2>
          <p className="mt-1 text-xs text-ink-500">{t("ownerPortal.projectImagesHint")}</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ink-300 px-4 py-3 text-sm font-semibold text-navy hover:border-navy">
            <Upload size={18} aria-hidden />
            {uploading ? t("common.loading") : t("ownerPortal.uploadImage")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>
          {images.length > 0 && (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img) => (
                <li key={img.id} className="overflow-hidden rounded-xl border border-ink-100">
                  <img src={img.url} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <button
                      type="button"
                      className={`text-xs font-bold ${img.isPrimary ? "text-brand-700" : "text-ink-500"}`}
                      onClick={() => setPrimary(img.id)}
                      title={t("ownerPortal.setPrimary")}
                    >
                      <Star size={14} className="inline" aria-hidden /> {img.isPrimary ? t("ownerPortal.primaryImage") : t("ownerPortal.setPrimary")}
                    </button>
                    <button type="button" className="text-xs font-bold text-red-600" onClick={() => deleteImage(img.id)}>
                      {t("adminDash.delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
