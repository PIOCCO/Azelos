import { FormEvent, useState } from "react";
import { useLocale } from "../lib/useLocale";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import { submitContact } from "../lib/contentApi";
import { INSTITUTION } from "../config/institution";

export default function ContactPage() {
  const { t, L } = useLocale();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName: String(fd.get("firstName") || "").trim(),
      lastName: String(fd.get("lastName") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim() || undefined,
      subject: String(fd.get("subject") || "").trim(),
      message: String(fd.get("message") || "").trim(),
    };
    const res = await submitContact(payload);
    if (res.error) {
      setStatus("error");
      setError(res.status === 429 ? t("inst.contact.rateLimit") : res.error);
      return;
    }
    setStatus("ok");
    e.currentTarget.reset();
  }

  return (
    <div className="page-shell">
      <PageMeta title={t("inst.contact.metaTitle")} description={t("inst.contact.intro")} path="/contact" />
      <div className="container-page max-w-2xl pb-16">
        <PageHeader title={t("inst.nav.contact")} description={t("inst.contact.intro")} />

        <dl className="mb-8 grid gap-2 rounded-xl border border-ink-200 bg-surface p-4 text-sm text-ink-700">
          <div>
            <dt className="font-semibold text-ink-900">{t("inst.contact.emailLabel")}</dt>
            <dd dir="ltr">{INSTITUTION.email}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-900">{t("inst.contact.addressLabel")}</dt>
            <dd>{L(INSTITUTION.address)}</dd>
          </div>
        </dl>

        {status === "ok" && (
          <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
            {t("inst.contact.success")}
          </p>
        )}
        {status === "error" && error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-ink-800">{t("inst.contact.firstName")} *</span>
              <input name="firstName" required maxLength={80} className="input mt-1 w-full" autoComplete="given-name" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink-800">{t("inst.contact.lastName")} *</span>
              <input name="lastName" required maxLength={80} className="input mt-1 w-full" autoComplete="family-name" />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-ink-800">{t("inst.contact.email")} *</span>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              className="input mt-1 w-full"
              autoComplete="email"
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-800">{t("inst.contact.phone")}</span>
            <input name="phone" type="tel" maxLength={32} className="input mt-1 w-full" autoComplete="tel" dir="ltr" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-800">{t("inst.contact.subject")} *</span>
            <input name="subject" required maxLength={200} className="input mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-800">{t("inst.contact.message")} *</span>
            <textarea
              name="message"
              required
              maxLength={5000}
              rows={6}
              className="input mt-1 w-full resize-y"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={status === "loading"}>
            {status === "loading" ? t("common.loading") : t("common.send")}
          </button>
        </form>
      </div>
    </div>
  );
}
