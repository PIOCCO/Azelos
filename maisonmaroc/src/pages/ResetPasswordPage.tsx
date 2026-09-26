import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { apiFetch } from "../lib/api";
import PageMeta from "../components/PageMeta";

export default function ResetPasswordPage() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(t("auth.resetMissingToken"));
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: err } = await apiFetch("/api/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    setSubmitting(false);
    if (err) setError(err);
    else setDone(true);
  };

  return (
    <div className="container-page py-12">
      <PageMeta title={t("auth.resetTitle")} path="/reset-password" />
      <div className="mx-auto max-w-md rounded-2xl border border-ink-100 bg-white p-8">
        <h1 className="text-xl font-bold text-ink-900">{t("auth.resetTitle")}</h1>
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {done ? (
          <p className="mt-4 text-sm text-brand-700">{t("auth.resetSuccess")}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">{t("auth.password")}</span>
              <div className="relative mt-1">
                <Lock size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
                <input
                  dir="ltr"
                  type="password"
                  required
                  minLength={8}
                  className="input w-full ps-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>
            <button type="submit" disabled={submitting || !token} className="btn-primary w-full">
              {t("auth.resetSubmit")}
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
