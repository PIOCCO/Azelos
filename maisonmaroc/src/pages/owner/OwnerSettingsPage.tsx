import { FormEvent, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../lib/useLocale";
import { apiFetch } from "../../lib/api";
import { PortalError, PortalSuccessBanner } from "../../components/owner/PortalStates";

export default function OwnerSettingsPage() {
  const { t, lang, changeLang } = useLocale();
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const body: Record<string, string> = {};
    if (name.trim()) body.name = name.trim();
    if (phone !== (user?.phone ?? "")) body.phone = phone;
    if (password) body.password = password;
    const { error: err } = await apiFetch("/api/owner/me", { method: "PATCH", body: JSON.stringify(body) });
    if (err) setError(err);
    else {
      setSuccess(t("ownerPortal.saved"));
      setPassword("");
      await refresh();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.settings")}</h1>
      {success && <PortalSuccessBanner message={success} />}
      {error && <PortalError message={error} />}

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy">{t("ownerPortal.accountSection")}</h2>
        <p className="mt-1 text-sm text-ink-500">
          {t("ownerPortal.accountEmail")}: <span dir="ltr">{user?.email}</span>
        </p>
        <p className="text-xs text-ink-400">{t("ownerPortal.roleLocked")}</p>
        <form onSubmit={saveAccount} className="mt-4 grid max-w-lg gap-4">
          <label className="block text-sm">
            <span className="font-semibold">{t("auth.fullName")}</span>
            <input required className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">{t("auth.phone")}</span>
            <input dir="ltr" className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">{t("ownerPortal.newPassword")}</span>
            <input dir="ltr" type="password" minLength={8} className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <span className="mt-1 block text-xs text-ink-400">{t("ownerPortal.passwordOptional")}</span>
          </label>
          <button type="submit" className="btn-primary w-fit">
            {t("ownerPortal.saveAccount")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy">{t("ownerPortal.languageSection")}</h2>
        <div className="mt-3 flex gap-2">
          <button type="button" className={`btn ${lang === "fr" ? "btn-primary" : "btn-secondary"}`} onClick={() => changeLang("fr")}>
            Français
          </button>
          <button type="button" className={`btn ${lang === "ar" ? "btn-primary" : "btn-secondary"}`} onClick={() => changeLang("ar")}>
            العربية
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-stone-50 p-6">
        <h2 className="text-lg font-bold text-navy">{t("ownerPortal.securitySection")}</h2>
        <p className="mt-2 text-sm text-ink-600">{t("ownerPortal.securityHint")}</p>
        {user?.authProvider === "google" && (
          <p className="mt-2 text-sm text-ink-600">{t("ownerPortal.googleLinked")}</p>
        )}
      </section>
    </div>
  );
}
