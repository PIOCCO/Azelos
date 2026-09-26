import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLocale } from "../lib/useLocale";
import { apiFetch } from "../lib/api";
import PageMeta from "../components/PageMeta";

export default function VerifyEmailPage() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage(t("auth.verifyMissingToken"));
      return;
    }
    (async () => {
      const { data, error } = await apiFetch<{ ok?: boolean; message?: string }>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (error) {
        setStatus("error");
        setMessage(error);
      } else {
        setStatus("ok");
        setMessage(data?.message || t("auth.verifySuccess"));
      }
    })();
  }, [params, t]);

  return (
    <div className="container-page py-12">
      <PageMeta title={t("auth.verifyTitle")} path="/verify-email" />
      <div className="mx-auto max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-ink-900">{t("auth.verifyTitle")}</h1>
        {status === "loading" && <p className="mt-4 text-sm text-ink-500">{t("common.loading")}</p>}
        {status !== "loading" && (
          <p className={`mt-4 text-sm ${status === "ok" ? "text-brand-700" : "text-red-600"}`} role="alert">
            {message}
          </p>
        )}
        <Link to="/client/login" className="btn-primary mt-6 inline-block">
          {t("auth.signIn")}
        </Link>
      </div>
    </div>
  );
}
