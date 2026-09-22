import { Link, useNavigate } from "react-router-dom";
import { Heart, Building2, LogOut, User2, Mail, Phone, PlusCircle } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useListings } from "../context/ListingsContext";
import PropertyCard from "../components/PropertyCard";
import AuthPage from "./AuthPage";

export default function AccountPage() {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const { properties } = useListings();
  const navigate = useNavigate();

  if (!user) return <AuthPage mode="login" />;

  const saved = properties.filter((p) => favorites.includes(p.id));
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="card p-6 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-2xl font-extrabold text-white">
              {initials}
            </div>
            <h2 className="mt-3 text-lg font-bold text-ink-900">{user.name}</h2>
            <p className="text-sm text-ink-500">{t("auth.welcome")} 👋</p>
            <div className="mt-4 space-y-2 text-start text-sm text-ink-600">
              <div className="flex items-center gap-2" dir="ltr">
                <Mail size={15} className="text-brand-500" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2" dir="ltr">
                  <Phone size={15} className="text-brand-500" /> {user.phone}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="btn-outline mt-5 w-full"
            >
              <LogOut size={16} /> {t("nav.logout")}
            </button>
          </div>

          <div className="card divide-y divide-ink-100">
            <div className="flex items-center gap-3 p-4 text-sm font-semibold text-ink-800">
              <User2 size={18} className="text-brand-500" /> {t("account.profileInfo")}
            </div>
            <Link to="/favorites" className="flex items-center justify-between p-4 text-sm text-ink-700 hover:bg-ink-50">
              <span className="flex items-center gap-3"><Heart size={18} className="text-rose-500" /> {t("account.myFavorites")}</span>
              <span className="chip">{favorites.length}</span>
            </Link>
            <Link to="/publish" className="flex items-center justify-between p-4 text-sm text-ink-700 hover:bg-ink-50">
              <span className="flex items-center gap-3"><Building2 size={18} className="text-brand-500" /> {t("account.myListings")}</span>
              <span className="chip">0</span>
            </Link>
          </div>
        </aside>

        <div>
          <h1 className="mb-4 text-2xl font-extrabold text-ink-900">{t("account.myFavorites")}</h1>
          {saved.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-16 text-center">
              <Heart size={40} className="text-ink-300" />
              <p className="font-semibold text-ink-700">{t("favorites.empty")}</p>
              <Link to="/search" className="btn-primary mt-1">{t("favorites.browse")}</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {saved.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}

          <div className="mt-8 rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center">
            <Building2 size={32} className="mx-auto text-ink-300" />
            <p className="mt-2 font-semibold text-ink-700">{t("account.noListings")}</p>
            <Link to="/publish" className="btn-primary mt-3">
              <PlusCircle size={16} /> {t("account.publishFirst")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
