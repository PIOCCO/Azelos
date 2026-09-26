import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import type { OwnerProfileBundle } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import { cityById } from "../../data/cities";
import ProfileCompletionBar from "../../components/owner/ProfileCompletionBar";
import { PortalError, PortalLoading, PortalSuccessBanner } from "../../components/owner/PortalStates";

export default function OwnerMemberProfilePage() {
  const { t, L } = useLocale();
  const [bundle, setBundle] = useState<OwnerProfileBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
        <form onSubmit={savePublic} className="mt-4 grid gap-4">
          <label className="block text-sm">
            <span className="font-semibold text-ink-700">{t("ownerPortal.logoUrl")}</span>
            <input dir="ltr" className="input mt-1" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
          </label>
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
