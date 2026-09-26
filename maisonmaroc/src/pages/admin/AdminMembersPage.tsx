import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Plus, RefreshCw, Search } from "lucide-react";
import { useLocale } from "../../lib/useLocale";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import AdminContentPanels from "../../components/admin/AdminContentPanels";

interface MemberRow {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  status: string;
  owner_profile_id?: string | null;
  created_at: string;
  company?: string | null;
  projectCount?: number;
  lastActivity?: string;
}

type AdminMembersPageProps = { adminBase?: string };

export default function AdminMembersPage({ adminBase = "/admin" }: AdminMembersPageProps) {
  const adminRoot = adminBase.replace(/\/$/, "") || "";
  const { t } = useLocale();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tab, setTab] = useState<"members" | "content">("members");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    companyFr: "",
    companyAr: "",
    cityId: "oujda",
    contactPosition: "",
  });

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    const { data, error: err } = await apiFetch<{ members: MemberRow[] }>(
      `/api/admin/members${params.toString() ? `?${params}` : ""}`,
    );
    if (err) setError(err);
    else {
      setError(null);
      setMembers(data?.members ?? []);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    if (tab === "members") load();
  }, [load, tab]);

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error: err } = await apiFetch("/api/admin/members", {
      method: "POST",
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        companyFr: form.companyFr,
        companyAr: form.companyAr,
        cityId: form.cityId,
        contactPosition: form.contactPosition || undefined,
        status: "ACTIVE",
      }),
    });
    if (err) setError(err);
    else {
      setForm((f) => ({ ...f, email: "", password: "", name: "", phone: "", companyFr: "", companyAr: "" }));
      load();
    }
  };

  const toggleStatus = async (member: MemberRow) => {
    const next = member.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await apiFetch(`/api/admin/members/${member.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-navy">{t("adminDash.title")}</h1>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={load} aria-label={t("adminDash.refresh")}>
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={async () => {
              await logout();
              navigate(`${adminRoot}/login`.replace("//", "/"));
            }}
          >
            <LogOut size={16} /> {t("nav.logout")}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-ink-100 pb-2">
        <button type="button" className={`btn ${tab === "members" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("members")}>
          {t("adminDash.tabMembers")}
        </button>
        <Link to={`${adminRoot}/projects`} className="btn-secondary">
          {t("adminDash.tabProjects")}
        </Link>
        <button type="button" className={`btn ${tab === "content" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("content")}>
          {t("adminDash.tabContent")}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {tab === "content" ? (
        <div className="mt-8">
          <AdminContentPanels />
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
              <Plus size={18} /> {t("adminDash.createMember")}
            </h2>
            <form onSubmit={createMember} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className="input" required placeholder={t("adminDash.contactName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input" placeholder={t("adminDash.contactPosition")} value={form.contactPosition} onChange={(e) => setForm({ ...form, contactPosition: e.target.value })} />
              <input className="input" required placeholder={t("adminDash.companyFr")} value={form.companyFr} onChange={(e) => setForm({ ...form, companyFr: e.target.value })} />
              <input dir="rtl" className="input" placeholder={t("adminDash.companyAr")} value={form.companyAr} onChange={(e) => setForm({ ...form, companyAr: e.target.value })} />
              <input dir="ltr" className="input" required type="email" placeholder={t("auth.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input dir="ltr" className="input" type="tel" placeholder={t("auth.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input dir="ltr" className="input" required type="password" minLength={8} placeholder={t("auth.password")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="submit" className="btn-primary sm:col-span-2">
                {t("adminDash.createMember")}
              </button>
            </form>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} aria-hidden />
                <input className="input w-full ps-9" placeholder={t("adminDash.searchMembers")} value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="input sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">{t("adminDash.allStatuses")}</option>
                <option value="ACTIVE">{t("adminDash.statusActive")}</option>
                <option value="DISABLED">{t("adminDash.statusSuspended")}</option>
              </select>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 text-start text-ink-600">
                  <tr>
                    <th className="px-4 py-3">{t("adminDash.company")}</th>
                    <th className="px-4 py-3">{t("adminDash.contact")}</th>
                    <th className="px-4 py-3">{t("auth.email")}</th>
                    <th className="px-4 py-3">{t("adminDash.status")}</th>
                    <th className="px-4 py-3">{t("adminDash.projectCount")}</th>
                    <th className="px-4 py-3">{t("adminDash.created")}</th>
                    <th className="px-4 py-3">{t("adminDash.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 font-medium">{m.company || "—"}</td>
                      <td className="px-4 py-3">{m.name}</td>
                      <td className="px-4 py-3" dir="ltr">
                        {m.email}
                      </td>
                      <td className="px-4 py-3">{m.status === "ACTIVE" ? t("adminDash.statusActive") : t("adminDash.statusSuspended")}</td>
                      <td className="px-4 py-3">{m.projectCount ?? 0}</td>
                      <td className="px-4 py-3">{new Date(m.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                        <Link to={`${adminRoot}/members/${m.id}`} className="font-semibold text-brand-700 hover:underline">
                          {t("adminDash.view")}
                        </Link>
                        <button type="button" className="text-brand-700 hover:underline" onClick={() => toggleStatus(m)}>
                          {m.status === "ACTIVE" ? t("adminDash.suspend") : t("adminDash.activate")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
