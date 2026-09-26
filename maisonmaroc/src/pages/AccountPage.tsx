import { Link, useNavigate } from "react-router-dom";
import { Heart, LogOut, Mail, MessageSquare, Phone } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useListings } from "../context/ListingsContext";
import PropertyCard from "../components/PropertyCard";
import { Navigate } from "react-router-dom";

/** Private account settings for normal (CLIENT) users — not a public APIO member profile. */
export default function AccountPage() {
  const { t } = useLocale();
  const { user, loading, logout } = useAuth();
  const { favorites } = useFavorites();
  const { properties } = useListings();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/client/login" replace />;
  if (user.role !== "CLIENT") return <Navigate to="/" replace />;

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
            <div
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-2xl font-extrabold text-white"
              aria-hidden
            >
              {initials}
            </div>
            <h2 className="mt-3 text-lg font-bold text-ink-900">{user.name}</h2>
            <p className="text-sm text-ink-500">{t("account.clientAccountHint")}</p>
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
              type="button"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="btn-outline mt-5 w-full"
            >
              <LogOut size={16} /> {t("nav.logout")}
            </button>
          </div>

          <div className="card divide-y divide-ink-100">
            <Link
              to="/client/messages"
              className="flex items-center justify-between p-4 text-sm text-ink-700 hover:bg-ink-50"
            >
              <span className="flex items-center gap-3">
                <MessageSquare size={18} className="text-brand-500" /> {t("nav.messages")}
              </span>
            </Link>
            <Link
              to="/favorites"
              className="flex items-center justify-between p-4 text-sm text-ink-700 hover:bg-ink-50"
            >
              <span className="flex items-center gap-3">
                <Heart size={18} className="text-rose-500" /> {t("account.myFavorites")}
              </span>
              <span className="chip">{favorites.length}</span>
            </Link>
          </div>
        </aside>

        <div>
          <h1 className="mb-4 text-2xl font-extrabold text-ink-900">{t("account.myFavorites")}</h1>
          {saved.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-16 text-center">
              <Heart size={40} className="text-ink-300" />
              <p className="font-semibold text-ink-700">{t("favorites.empty")}</p>
              <Link to="/projets" className="btn-primary mt-2">
                {t("nav.properties")}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {saved.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
