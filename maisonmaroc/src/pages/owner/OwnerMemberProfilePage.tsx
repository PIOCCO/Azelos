import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Upload, User } from "lucide-react";
import { apiFetch } from "../../lib/api";
import type { OwnerProfileBundle } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import { cityById } from "../../data/cities";
import ProfileCompletionBar from "../../components/owner/ProfileCompletionBar";
import { PortalError, PortalLoading, PortalSuccessBanner } from "../../components/owner/PortalStates";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function avatarSrc(url: string | undefined) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("//")) return url;
  return `${API_BASE}${url}`;
}

export default function OwnerMemberProfilePage() {
  const { t, L } = useLocale();
  const [bundle, setBundle] = useState<OwnerProfileBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [form, setForm] = useState({
    bioFr: "",
    bioAr: "",
    phone: "",
    whatsapp: "",
    emailPublic: "",
    website: "",
    avatarUrl: "",
  });

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await apiFetch<OwnerProfileBundle>("/api/owner/profile");
    if (err) setError(err);
    else if (data) {
      setBundle(data);
      const o = data.overrides;
      setForm({
        bioFr: o?.bioFr ?? data.publicProfile.bio?.fr ?? "",
        bioAr: o?.bioAr ?? data.publicProfile.bio?.ar ?? "",
        phone: o?.phone ?? data.publicProfile.phone ?? "",
        whatsapp: o?.whatsapp ?? data.publicProfile.whatsapp ?? "",
        emailPublic: o?.emailPublic ?? data.publicProfile.email ?? "",
        website: o?.website ?? data.publicProfile.website ?? "",
        avatarUrl: o?.avatarUrl ?? data.publicProfile.avatar ?? "",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const previewAvatar = useMemo(
    () => avatarSrc(bundle?.publicProfile.avatar || form.avatarUrl),
    [bundle?.publicProfile.avatar, form.avatarUrl],
  );

  const savePublic = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    const { data, error: err } = await apiFetch<OwnerProfileBundle>("/api/owner/profile", {
      method: "PATCH",
      body: JSON.stringify({
        bioFr: form.bioFr,
        bioAr: form.bioAr,
        phone: form.phone,
        whatsapp: form.whatsapp,
        emailPublic: form.emailPublic,
        website: form.website || null,
        avatarUrl: form.avatarUrl || null,
      }),
    });
    if (err) setError(err);
    else {
      setError(null);
      setBundle(data ?? null);
      setSuccess(t("ownerPortal.saved"));
    }
  };

  const onAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/owner/profile/avatar`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : t("ownerPortal.uploadFailed"));
      } else {
        setBundle(body as OwnerProfileBundle);
        setForm((f) => ({ ...f, avatarUrl: (body as OwnerProfileBundle).publicProfile.avatar || "" }));
        setSuccess(t("ownerPortal.avatarUpdated"));
      }
    } catch {
      setError(t("ownerPortal.uploadFailed"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!confirm(t("ownerPortal.confirmRemoveAvatar"))) return;
    setError(null);
    const { data, error: err } = await apiFetch<OwnerProfileBundle>("/api/owner/profile/avatar", {
      method: "DELETE",
    });
    if (err) setError(err);
    else {
      setBundle(data ?? null);
      setForm((f) => ({ ...f, avatarUrl: "" }));
      setSuccess(t("ownerPortal.avatarRemoved"));
    }
  };

  if (error && !bundle) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.profile")}</h1>
        <div className="mt-6">
          <PortalError message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.profile")}</h1>
        <div className="mt-6">
          <PortalLoading />
        </div>
      </div>
    );
  }

  const city = cityById(bundle.seedLocked.cityId || bundle.publicProfile.cityId || "");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.profile")}</h1>
      {success && <PortalSuccessBanner message={success} />}
      {error && <PortalError message={error} onRetry={load} />}
      <ProfileCompletionBar completion={bundle.profileCompletion} />

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy">{t("ownerPortal.orgSection")}</h2>
        <p className="mt-1 text-xs text-ink-500">{t("ownerPortal.orgLockedHint")}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="font-semibold text-ink-500">{t("ownerPortal.companyName")}</dt>
            <dd className="text-ink-900">{L(bundle.seedLocked.agency) || L(bundle.seedLocked.name)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-500">{t("ownerPortal.legalName")}</dt>
            <dd className="text-ink-900">{L(bundle.seedLocked.name)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-500">{t("ownerPortal.companyType")}</dt>
            <dd className="text-ink-900">{t(`owner.${bundle.seedLocked.type}`)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-500">{t("ownerPortal.city")}</dt>
            <dd className="text-ink-900">{city ? L(city.name) : "—"}</dd>
          </div>
        </dl>
      </section>

      <section id="public" className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy">{t("ownerPortal.publicInfoSection")}</h2>
        <p className="mt-1 text-xs text-ink-500">{t("ownerPortal.publicInfoHint")}</p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-stone-100">
            {previewAvatar ? (
              <img src={previewAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-400" aria-hidden>
                <User size={40} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="btn-primary inline-flex cursor-pointer items-center gap-2">
              <Upload size={16} aria-hidden />
              {avatarUploading ? t("common.loading") : t("ownerPortal.uploadAvatar")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={avatarUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onAvatarUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            {previewAvatar && (
              <button type="button" className="btn-secondary inline-flex items-center gap-2 text-red-700" onClick={removeAvatar}>
                <Trash2 size={16} aria-hidden />
                {t("ownerPortal.removeAvatar")}
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-500">{t("ownerPortal.avatarHint")}</p>

        <form onSubmit={savePublic} className="mt-6 grid gap-4">
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-ink-600">{t("ownerPortal.avatarUrlOptional")}</summary>
            <label className="mt-2 block">
              <input
                dir="ltr"
                className="input mt-1"
                value={form.avatarUrl.startsWith("/api/") ? "" : form.avatarUrl}
                placeholder="https://…"
                onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              />
            </label>
          </details>
          <label className="block text-sm">
            <span className="font-semibold text-ink-700">{t("ownerPortal.descriptionFr")}</span>
            <textarea className="input mt-1 min-h-[100px]" value={form.bioFr} onChange={(e) => setForm({ ...form, bioFr: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-ink-700">{t("ownerPortal.descriptionAr")}</span>
            <textarea dir="rtl" className="input mt-1 min-h-[100px]" value={form.bioAr} onChange={(e) => setForm({ ...form, bioAr: e.target.value })} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-semibold text-ink-700">{t("auth.phone")}</span>
              <input dir="ltr" className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-ink-700">WhatsApp</span>
              <input dir="ltr" className="input mt-1" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-ink-700">{t("ownerPortal.publicEmail")}</span>
              <input dir="ltr" type="email" className="input mt-1" value={form.emailPublic} onChange={(e) => setForm({ ...form, emailPublic: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-ink-700">{t("ownerPortal.website")}</span>
              <input dir="ltr" type="url" className="input mt-1" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </label>
          </div>
          <button type="submit" className="btn-primary w-fit">
            {t("ownerPortal.savePublic")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-stone-50 p-6">
        <h2 className="text-lg font-bold text-navy">{t("ownerPortal.privateAccountSection")}</h2>
        <p className="mt-2 text-sm text-ink-600">
          {t("ownerPortal.accountEmail")}: <span dir="ltr">{bundle.account.email}</span>
        </p>
        <p className="text-sm text-ink-600">
          {t("ownerPortal.contactPerson")}: {bundle.account.name}
        </p>
        <Link to="/owner/settings" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
          {t("ownerPortal.nav.settings")} →
        </Link>
      </section>
    </div>
  );
}
