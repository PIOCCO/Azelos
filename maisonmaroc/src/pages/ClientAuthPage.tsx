import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User2, Phone } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import SmartImage from "../components/SmartImage";
import BrandLogo from "../components/BrandLogo";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { apiFetch, dashboardPathForRole, googleOAuthStartUrl } from "../lib/api";
import { resolveGoogleClientId, signInWithGoogleIdToken } from "../lib/googleAuth";

export default function ClientAuthPage({ mode }: { mode: "login" | "register" }) {
  const { t } = useLocale();
  const { user, setUser, refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [apiGoogleClientId, setApiGoogleClientId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registerSent, setRegisterSent] = useState(false);

  const googleClientId = resolveGoogleClientId(apiGoogleClientId);

  useEffect(() => {
    if (user) {
      navigate(dashboardPathForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const oauthErr = params.get("error");
    if (oauthErr === "oauth_cancelled") setError(t("auth.oauthCancelled"));
    else if (oauthErr) setError(t("auth.oauthFailed"));
  }, [params, t]);

  useEffect(() => {
    apiFetch<{ enabled: boolean; clientId: string | null }>("/api/auth/google/config").then(
      ({ data }) => {
        if (data?.clientId) setApiGoogleClientId(data.clientId);
      },
    );
  }, []);

  const navigateAfterAuth = (role: NonNullable<typeof user>["role"]) => {
    const next = params.get("next");
    if (next && next.startsWith("/")) {
      navigate(next);
      return;
    }
    navigate(dashboardPathForRole(role));
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    setSubmitting(true);
    const { data, error: err } = await signInWithGoogleIdToken(idToken);
    setSubmitting(false);
    if (err || !data?.user) {
      setError(err || t("auth.oauthFailed"));
      return;
    }
    setUser(data.user);
    await refresh();
    navigateAfterAuth(data.user.role);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const path = isLogin ? "/api/auth/client/login" : "/api/auth/client/register";
    const body = isLogin
      ? { email, password }
      : { email, password, name, phone: phone || undefined };
    const { data, error: err } = await apiFetch<{ user?: typeof user; ok?: boolean; message?: string }>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    if (!isLogin) {
      setRegisterSent(true);
      return;
    }
    if (!data?.user) {
      setError(t("auth.errorGeneric"));
      return;
    }
    setUser(data.user);
    await refresh();
    navigateAfterAuth(data.user.role);
  };

  return (
    <div className="container-page py-10">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl shadow-card ring-1 ring-ink-100 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <SmartImage
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70"
            fallbackSeed="mm-auth"
            alt=""
            className="h-full min-h-[420px] w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <BrandLogo variant="onLight" linkToHome={false} />
          </div>
        </div>

        <div className="bg-white p-8">
          <div className="mb-6 lg:hidden">
            <BrandLogo variant="onLight" linkToHome={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900">
            {isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
          </p>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          {registerSent && (
            <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800" role="status">
              {t("auth.registerVerifySent")}
            </p>
          )}

          {!registerSent && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="field-label">{t("auth.fullName")}</label>
                <div className="relative">
                  <User2 size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
                  <input className="input ps-9" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <label className="field-label">{t("auth.email")}</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
                <input dir="ltr" type="email" className="input ps-9" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="field-label">{t("auth.phone")}</label>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
                  <input dir="ltr" className="input ps-9" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <label className="field-label">{t("auth.password")}</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
                <input dir="ltr" type="password" className="input ps-9" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            {isLogin && (
              <p className="text-end text-sm">
                <Link to="/forgot-password" className="text-brand-700 hover:underline">
                  {t("auth.forgotPasswordLink")}
                </Link>
              </p>
            )}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {isLogin ? t("auth.login") : t("auth.register")}
            </button>
          </form>
          )}

          <div className="mt-4">
            <p className="mb-2 text-center text-xs text-ink-400">{t("auth.orContinue")}</p>
            {googleClientId ? (
              <GoogleSignInButton
                clientId={googleClientId}
                onCredential={handleGoogleCredential}
                onError={(msg) => setError(msg)}
              />
            ) : (
              <a
                href={googleOAuthStartUrl(params.get("next") || "/")}
                className="btn-secondary flex w-full items-center justify-center gap-2"
              >
                <GoogleIcon />
                {t("auth.google")}
              </a>
            )}
            <p className="mt-2 text-center text-[11px] text-ink-400">{t("auth.googleClientOnly")}</p>
          </div>

          <p className="mt-4 text-center text-sm text-ink-600">
            {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <Link
              to={isLogin ? "/client/register" : "/client/login"}
              className="font-semibold text-brand-700 hover:underline"
            >
              {isLogin ? t("auth.createAccount") : t("auth.signIn")}
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-ink-400">
            <Link to="/owner/login" className="hover:text-brand-600">
              {t("auth.ownerPortalLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-5.522 0-10-4.477-10-10s4.478-10 10-10c2.523 0 4.817.926 6.603 2.463l6.062-6.062C33.408 9.835 28.956 8 24 8 12.955 8 4 16.955 4 28s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c2.523 0 4.817.926 6.603 2.463l6.062-6.062C33.408 9.835 28.956 8 24 8 16.318 8 9.656 13.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
      />
    </svg>
  );
}
