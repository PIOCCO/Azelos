import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import { apiFetch, dashboardPathForRole } from "../lib/api";

export default function OwnerLoginPage() {
  const { t } = useLocale();
  const { user, setUser, refresh } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === "REAL_ESTATE_OWNER") navigate("/owner", { replace: true });
    else if (user) navigate(dashboardPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { data, error: err } = await apiFetch<{ user: typeof user }>("/api/auth/owner/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setSubmitting(false);
    if (err || !data?.user) {
      setError(err || t("auth.errorGeneric"));
      return;
    }
    setUser(data.user);
    await refresh();
    navigate("/owner");
  };

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-card ring-1 ring-ink-100">
        <BrandLogo variant="onLight" showTagline linkToHome={false} />
        <h1 className="mt-6 text-2xl font-extrabold text-ink-900">{t("auth.ownerLoginTitle")}</h1>
        <p className="mt-1 text-sm text-ink-500">{t("auth.ownerLoginSubtitle")}</p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="field-label">{t("auth.email")}</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
              <input dir="ltr" type="email" className="input ps-9" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">{t("auth.password")}</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
              <input dir="ltr" type="password" className="input ps-9" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {t("auth.login")}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-400">{t("auth.ownerNoRegister")}</p>
        <p className="mt-3 text-center text-sm">
          <Link to="/client/login" className="font-semibold text-brand-700 hover:underline">
            {t("auth.clientLoginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
