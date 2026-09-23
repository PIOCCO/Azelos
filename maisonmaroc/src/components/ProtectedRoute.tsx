import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../lib/api";
import { dashboardPathForRole } from "../lib/api";

export default function ProtectedRoute({
  roles,
  loginPath,
}: {
  roles: UserRole[];
  loginPath: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container-page py-16 text-center text-ink-500">
        …
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
