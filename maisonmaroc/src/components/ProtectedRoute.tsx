import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../lib/api";
import { useLocale } from "../lib/useLocale";

export default function ProtectedRoute({
  roles,
  loginPath,
}: {
  roles: UserRole[];
  loginPath: string;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { t } = useLocale();

  if (loading) {
    return (
      <div className="container-page py-16 text-center text-ink-500" role="status" aria-live="polite">
        {t("common.loading")}
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
