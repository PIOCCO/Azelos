import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { PRODUCT_NAME } from "../brand";
import { useApp } from "../context/AppContext";
import { api } from "../api";

const links = [
  { to: "/", label: "Overview" },
  { to: "/infrastructure", label: "Infrastructure" },
  { to: "/resilience/backups", label: "Resilience · Backups" },
  { to: "/resilience/dr", label: "Resilience · DR" },
  { to: "/security", label: "Security" },
  { to: "/finops", label: "FinOps" },
  { to: "/alerts", label: "Alerts" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
];

export default function MainLayout() {
  const { meta, session, setTenantId, isProvider } = useApp();
  const loc = useLocation();
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadTenants = async () => {
    if (!isProvider) return;
    try {
      const rows = await api<{ id: string; name: string }[]>("/customers");
      setTenants(rows);
    } catch {
      /* viewer path */
    }
  };

  useEffect(() => {
    if (isProvider) loadTenants();
  }, [isProvider]);

  const sync = async () => {
    if (!window.confirm(`Run discovery sync for tenant ${session.tenantId}?`)) return;
    setSyncing(true);
    try {
      await api(`/sync?tenant_id=${session.tenantId}`, { method: "POST" });
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="layout">
      <aside>
        <h1>{PRODUCT_NAME}</h1>
        {meta?.demo_mode && <div className="demo-badge">Simulated data</div>}
        {isProvider ? (
          <label className="tenant-select">
            Tenant context
            <select
              value={session.tenantId}
              onChange={(e) => {
                if (window.confirm(`Switch operational context to ${e.target.value}?`)) setTenantId(e.target.value);
              }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              {!tenants.length && <option value={session.tenantId}>{session.tenantId}</option>}
            </select>
          </label>
        ) : (
          <p className="muted">Organization workspace</p>
        )}
        <nav>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={loc.pathname === l.to ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button type="button" className="sync" disabled={syncing} onClick={sync}>
          {syncing ? "Syncing…" : "Run discovery sync"}
        </button>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
