import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ApiError } from "../../api/client";
import { isPolicyAcceptanceRequired } from "../../api/parseApiError";
import { fetchPolicyStatus } from "../../api/policies";
import { useTranslation } from "../../i18n/LocaleContext";
import { ErrorState, LoadingSkeleton } from "../ui/States";

/** Blocks app until mandatory policies are accepted (backend enforces API too). */
export function PolicyAcceptanceGate() {
  const { t } = useTranslation();
  const location = useLocation();
  const onLegal = location.pathname.startsWith("/legal/");
  const onAcceptance = location.pathname === "/policy-acceptance";

  const statusQ = useQuery({
    queryKey: ["policy-status"],
    queryFn: fetchPolicyStatus,
    retry: 1,
    staleTime: 0,
  });

  if (statusQ.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (statusQ.isError) {
    const err = statusQ.error;
    if (err instanceof ApiError && isPolicyAcceptanceRequired(err.code)) {
      if (!onLegal && !onAcceptance) {
        return <Navigate to="/policy-acceptance" replace state={{ from: location.pathname }} />;
      }
      return <Outlet />;
    }
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <ErrorState
          title={t("policies.statusLoadFailed")}
          message={err instanceof Error ? err.message : t("errors.loadFailed")}
          onRetry={() => statusQ.refetch()}
        />
      </div>
    );
  }

  const enforced = statusQ.data?.enforcement_enabled ?? true;
  const pending = enforced && !statusQ.data?.all_accepted;

  if (pending && !onLegal && !onAcceptance) {
    return <Navigate to="/policy-acceptance" replace state={{ from: location.pathname }} />;
  }

  if (!pending && onAcceptance) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
