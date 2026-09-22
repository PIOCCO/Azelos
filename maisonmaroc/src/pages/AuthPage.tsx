import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User2, Phone } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import SmartImage from "../components/SmartImage";
import BrandLogo from "../components/BrandLogo";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { t } = useLocale();
  const { login } = useAuth();
  const navigate = useNavigate();
  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      name: name || email.split("@")[0] || "Utilisateur",
      email,
      phone,
    });
    navigate("/account");
  };

  return (
    <div className="container-page py-10">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl shadow-card ring-1 ring-ink-100 lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <SmartImage
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70"
            fallbackSeed="mm-auth"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 to-brand-700/40 p-8 text-white">
            <div className="flex h-full flex-col justify-end">
              <BrandLogo variant="auth" linkToHome={false} />
            </div>
          </div>
        </div>

        <div className="bg-white p-8">
          <div className="mb-6 lg:hidden">
            <BrandLogo variant="onLight" showTagline linkToHome={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900">
            {isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
          </p>

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
                <input dir="ltr" type="password" className="input ps-9" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              {isLogin ? t("auth.login") : t("auth.register")}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-400">{t("auth.demoNote")}</p>

          <p className="mt-4 text-center text-sm text-ink-600">
            {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <Link
              to={isLogin ? "/register" : "/login"}
              className="font-semibold text-brand-700 hover:underline"
            >
              {isLogin ? t("auth.createAccount") : t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
