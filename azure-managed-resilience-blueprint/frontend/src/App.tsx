import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken } from "./api";
import { AppProvider } from "./context/AppContext";
import MainLayout from "./layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Resources from "./pages/Resources";
import Backups from "./pages/Backups";
import DR from "./pages/DR";
import Security from "./pages/Security";
import FinOps from "./pages/FinOps";
import Alerts from "./pages/Alerts";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  useEffect(() => setAuthed(!!getToken()), []);

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setAuthed(true)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/infrastructure" element={<Resources />} />
          <Route path="/resilience/backups" element={<Backups />} />
          <Route path="/resilience/dr" element={<DR />} />
          <Route path="/security" element={<Security />} />
          <Route path="/finops" element={<FinOps />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
