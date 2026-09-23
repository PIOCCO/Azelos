import { Navigate, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import OwnerProfilePage from "./pages/OwnerProfilePage";
import AgentsPage from "./pages/AgentsPage";
import FavoritesPage from "./pages/FavoritesPage";
import PublishPage from "./pages/PublishPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import ClientAuthPage from "./pages/ClientAuthPage";
import OwnerLoginPage from "./pages/OwnerLoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/property/:slug" element={<PropertyDetailsPage />} />
        <Route path="/agent/:id" element={<OwnerProfilePage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/publish" element={<PublishPage />} />

        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/client/login" element={<ClientAuthPage mode="login" />} />
        <Route path="/client/register" element={<ClientAuthPage mode="register" />} />
        <Route path="/client/account" element={<AccountPage />} />
        <Route path="/account" element={<Navigate to="/client/account" replace />} />

        <Route path="/owner/login" element={<OwnerLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute roles={["REAL_ESTATE_OWNER"]} loginPath="/owner/login" />}>
          <Route path="/owner" element={<OwnerDashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["SUPER_ADMIN"]} loginPath="/admin/login" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
