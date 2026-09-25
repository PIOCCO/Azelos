import { Navigate, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import OwnerProfilePage from "./pages/OwnerProfilePage";
import MembersPage from "./pages/MembersPage";
import FavoritesPage from "./pages/FavoritesPage";
import PublishPage from "./pages/PublishPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import ClientAuthPage from "./pages/ClientAuthPage";
import OwnerLoginPage from "./pages/OwnerLoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import MessagesPage from "./pages/MessagesPage";
import NotFoundPage from "./pages/NotFoundPage";
import TooManyRequestsPage from "./pages/TooManyRequestsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NewsPage from "./pages/NewsPage";
import NewsArticlePage from "./pages/NewsArticlePage";
import EventsPage from "./pages/EventsPage";
import DocumentsPage from "./pages/DocumentsPage";
import FaqPage from "./pages/FaqPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import MentionsLegalesPage from "./pages/legal/MentionsLegalesPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import CookiesPage from "./pages/legal/CookiesPage";
import TermsPage from "./pages/legal/TermsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/membres" element={<MembersPage />} />
        <Route path="/projets" element={<SearchPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/property/:slug" element={<PropertyDetailsPage />} />
        <Route path="/agent/:id" element={<OwnerProfilePage />} />
        <Route path="/agents" element={<Navigate to="/membres" replace />} />
        <Route path="/actualites" element={<NewsPage />} />
        <Route path="/actualites/:slug" element={<NewsArticlePage />} />
        <Route path="/evenements" element={<EventsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/legal/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/legal/confidentialite" element={<PrivacyPage />} />
        <Route path="/legal/cookies" element={<CookiesPage />} />
        <Route path="/legal/cgu" element={<TermsPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/429" element={<TooManyRequestsPage />} />

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

        <Route element={<ProtectedRoute roles={["CLIENT"]} loginPath="/client/login" />}>
          <Route path="/client/messages" element={<MessagesPage role="CLIENT" />} />
          <Route path="/client/messages/:id" element={<MessagesPage role="CLIENT" />} />
        </Route>

        <Route element={<ProtectedRoute roles={["REAL_ESTATE_OWNER"]} loginPath="/owner/login" />}>
          <Route path="/owner" element={<OwnerDashboardPage />} />
          <Route path="/owner/messages" element={<MessagesPage role="REAL_ESTATE_OWNER" />} />
          <Route path="/owner/messages/:id" element={<MessagesPage role="REAL_ESTATE_OWNER" />} />
        </Route>

        <Route element={<ProtectedRoute roles={["SUPER_ADMIN"]} loginPath="/admin/login" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
