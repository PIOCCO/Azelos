import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@shared/components/ProtectedRoute";
import AdminLoginPage from "@shared/pages/AdminLoginPage";
import AdminMembersPage from "@shared/pages/admin/AdminMembersPage";
import AdminMemberDetailPage from "@shared/pages/admin/AdminMemberDetailPage";
import AdminProjectsPage from "@shared/pages/admin/AdminProjectsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage loginPath="/login" homePath="/" />} />
      <Route element={<ProtectedRoute roles={["SUPER_ADMIN"]} loginPath="/login" />}>
        <Route path="/" element={<AdminMembersPage adminBase="/" />} />
        <Route path="/members/:id" element={<AdminMemberDetailPage adminBase="/" />} />
        <Route path="/projects" element={<AdminProjectsPage adminBase="/" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
