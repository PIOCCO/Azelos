import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken } from "./api";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";
import Audit from "./pages/Audit";
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
import CustomerLayout from "./customer/CustomerLayout";
import CustomerOverview from "./customer/pages/Overview";
import FinancialOverview from "./customer/pages/FinancialOverview";
import FinancialServices from "./customer/pages/FinancialServices";
import FinancialResources from "./customer/pages/FinancialResources";
import FinancialTrends from "./customer/pages/FinancialTrends";
import FinancialSavings from "./customer/pages/FinancialSavings";
import CustomerInfrastructure from "./customer/pages/Infrastructure";
import ResourceDetail from "./customer/pages/ResourceDetail";
import {
  BackupsPage,
  CustomerAlerts,
  CustomerRecommendations,
  CustomerReports,
  CustomerSettings,
  DRPage,
  ResiliencePage,
  SecurityPage,
} from "./customer/pages/SimplePages";

function isCustomerRole() {
  const role = localStorage.getItem("atlas_role") || "";
  return role === "CUSTOMER_ADMIN" || role === "CUSTOMER_VIEWER";
}

function RoleGuard({ children, customer }: { children: React.ReactNode; customer?: boolean }) {
  const loc = useLocation();
  if (customer && !isCustomerRole()) return <Navigate to="/" replace />;
  if (!customer && isCustomerRole() && !loc.pathname.startsWith("/customer")) {
    return <Navigate to="/customer" replace />;
  }
  return <>{children}</>;
}

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
      <ToastProvider>
        <Routes>
          <Route
            path="/login"
            element={<Navigate to={isCustomerRole() ? "/customer" : "/"} replace />}
          />
          <Route
            element={
              <RoleGuard customer>
                <CustomerLayout />
              </RoleGuard>
            }
          >
            <Route path="/customer" element={<CustomerOverview />} />
            <Route path="/customer/financial" element={<FinancialOverview />} />
            <Route path="/customer/financial/services" element={<FinancialServices />} />
            <Route path="/customer/financial/resources" element={<FinancialResources />} />
            <Route path="/customer/financial/trends" element={<FinancialTrends />} />
            <Route path="/customer/financial/savings" element={<FinancialSavings />} />
            <Route path="/customer/infrastructure" element={<CustomerInfrastructure />} />
            <Route path="/customer/infrastructure/:resourceId" element={<ResourceDetail />} />
            <Route path="/customer/resilience" element={<ResiliencePage />} />
            <Route path="/customer/backups" element={<BackupsPage />} />
            <Route path="/customer/dr" element={<DRPage />} />
            <Route path="/customer/security" element={<SecurityPage />} />
            <Route path="/customer/alerts" element={<CustomerAlerts />} />
            <Route path="/customer/recommendations" element={<CustomerRecommendations />} />
            <Route path="/customer/reports" element={<CustomerReports />} />
            <Route path="/customer/settings" element={<CustomerSettings />} />
          </Route>
          <Route
            element={
              <RoleGuard>
                <MainLayout />
              </RoleGuard>
            }
          >
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
            <Route path="/audit" element={<Audit />} />
          </Route>
          <Route path="*" element={<Navigate to={isCustomerRole() ? "/customer" : "/"} replace />} />
        </Routes>
      </ToastProvider>
    </AppProvider>
  );
}
