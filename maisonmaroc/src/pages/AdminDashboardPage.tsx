import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, RefreshCw } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import AdminContentPanels from "../components/admin/AdminContentPanels";

interface OwnerRow {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  status: string;
  owner_profile_id?: string | null;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    companyFr: "",
  });

  const load = useCallback(async () => {
    const { data, error: err } = await apiFetch<{ owners: OwnerRow[] }>("/api/admin/owners");
    if (err) setError(err);
    else {
      setError(null);
      setOwners(data?.owners ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error: err } = await apiFetch("/api/admin/members", {
      method: "POST",
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        companyFr: form.companyFr || form.name,
        cityId: "oujda",
        status: "ACTIVE",
      }),
    });
    if (err) setError(err);
    else {
      setForm((f) => ({ ...f, email: "", password: "", name: "", phone: "", companyFr: "" }));
      load();
    }
  };

  const toggleStatus = async (owner: OwnerRow) => {
    const next = owner.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await apiFetch(`/api/admin/owners/${owner.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  const removeOwner = async (id: string) => {
    if (!confirm(t("adminDash.confirmDelete"))) return;
    await apiFetch(`/api/admin/owners/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-ink-900">{t("adminDash.title")}</h1>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={load} aria-label={t("adminDash.refresh")}>
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={async () => {
              await logout();
              navigate("/admin/login");
            }}
          >
            <LogOut size={16} /> {t("nav.logout")}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Plus size={18} /> {t("adminDash.createOwner")}
        </h2>
        <form onSubmit={createOwner} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="input" required placeholder={t("auth.fullName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input dir="ltr" className="input" required type="email" placeholder={t("auth.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input dir="ltr" className="input" type="tel" placeholder={t("auth.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" required type="password" minLength={8} placeholder={t("auth.password")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="input sm:col-span-2" placeholder={t("adminDash.companyFr")} value={form.companyFr} onChange={(e) => setForm({ ...form, companyFr: e.target.value })} aria-label={t("adminDash.companyFr")} />
          <button type="submit" className="btn-primary sm:col-span-2">
            {t("adminDash.createOwner")}
          </button>
        </form>
      </section>

      <section className="mt-8 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-50 text-start text-ink-600">
            <tr>
              <th className="px-4 py-3">{t("auth.fullName")}</th>
              <th className="px-4 py-3">{t("auth.email")}</th>
              <th className="px-4 py-3">{t("adminDash.profile")}</th>
              <th className="px-4 py-3">{t("adminDash.status")}</th>
              <th className="px-4 py-3">{t("adminDash.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {owners.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3" dir="ltr">
                  {o.email}
                </td>
                <td className="px-4 py-3">{o.owner_profile_id || "—"}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3 space-x-2">
                  <button type="button" className="text-brand-700 hover:underline" onClick={() => toggleStatus(o)}>
                    {o.status === "ACTIVE" ? t("adminDash.disable") : t("adminDash.enable")}
                  </button>
                  <button type="button" className="text-red-600 hover:underline" onClick={() => removeOwner(o.id)}>
                    {t("adminDash.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <AdminContentPanels />
    </div>
  );
}
