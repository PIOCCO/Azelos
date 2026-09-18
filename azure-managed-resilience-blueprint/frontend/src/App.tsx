import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, getToken } from "./api";
import Dashboard from "./pages/Dashboard";
import Resources from "./pages/Resources";
import Backups from "./pages/Backups";
import DR from "./pages/DR";
import Security from "./pages/Security";
import FinOps from "./pages/FinOps";
import Alerts from "./pages/Alerts";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

const nav = [
  ["", "Dashboard"],
  ["resources", "Infrastructure"],
  ["backups", "Backups"],
  ["dr", "Disaster Recovery"],
  ["security", "Security"],
  ["finops", "FinOps"],
  ["alerts", "Alerts"],
  ["recommendations", "Recommendations"],
  ["reports", "Reports"],
] as const;

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const navTo = useNavigate();
  const tenant = localStorage.getItem("amrf_tenant") || "tenant-demo";

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setAuthed(true)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const sync = async () => {
    await api(`/sync?tenant_id=${tenant}`, { method: "POST" });
    navTo(0);
    window.location.reload();
  };

  return (
    <div className="layout">
      <aside>
        <h1>Azure Resilience</h1>
        <p className="muted">Tenant: {tenant}</p>
        {nav.map(([path, label]) => (
          <Link key={path} to={path ? `/${path}` : "/"}>
            {label}
          </Link>
        ))}
        <button type="button" className="sync" onClick={sync}>
          Run discovery sync
        </button>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard tenant={tenant} />} />
          <Route path="/resources" element={<Resources tenant={tenant} />} />
          <Route path="/backups" element={<Backups tenant={tenant} />} />
          <Route path="/dr" element={<DR tenant={tenant} />} />
          <Route path="/security" element={<Security tenant={tenant} />} />
          <Route path="/finops" element={<FinOps tenant={tenant} />} />
          <Route path="/alerts" element={<Alerts tenant={tenant} />} />
          <Route path="/recommendations" element={<Recommendations tenant={tenant} />} />
          <Route path="/reports" element={<Reports tenant={tenant} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
