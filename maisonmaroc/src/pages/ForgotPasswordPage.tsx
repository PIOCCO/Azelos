import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { apiFetch } from "../lib/api";
import PageMeta from "../components/PageMeta";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await apiFetch("/api/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <div className="container-page py-12">
      <PageMeta title={t("auth.forgotTitle")} path="/forgot-password" />
      <div className="mx-auto max-w-md rounded-2xl border border-ink-100 bg-white p-8">
        <h1 className="text-xl font-bold text-ink-900">{t("auth.forgotTitle")}</h1>
        <p className="mt-2 text-sm text-ink-500">{t("auth.forgotSubtitle")}</p>
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {sent ? (
          <p className="mt-4 text-sm text-brand-700">{t("auth.forgotSent")}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">{t("auth.email")}</span>
              <div className="relative mt-1">
                <Mail size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
                <input
                  dir="ltr"
                  type="email"
                  required
                  className="input w-full ps-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {t("auth.forgotSubmit")}
            </button>
          </form>
        )}
        <Link to="/client/login" className="mt-6 inline-block text-sm text-brand-700 hover:underline">
          {t("auth.signIn")}
        </Link>
      </div>
    </div>
  );
}
