import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import OwnerProfilePage from "./pages/OwnerProfilePage";
import AgentsPage from "./pages/AgentsPage";
import FavoritesPage from "./pages/FavoritesPage";
import PublishPage from "./pages/PublishPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
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
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
