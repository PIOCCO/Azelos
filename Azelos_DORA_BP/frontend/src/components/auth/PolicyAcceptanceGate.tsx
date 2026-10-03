import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { fetchPolicyStatus } from "../../api/policies";
import { LoadingSkeleton } from "../ui/States";

/** Blocks app until mandatory policies are accepted (backend enforces API too). */
export function PolicyAcceptanceGate() {
  const location = useLocation();
  const onLegal = location.pathname.startsWith("/legal/");
  const onAcceptance = location.pathname === "/policy-acceptance";

  const statusQ = useQuery({
    queryKey: ["policy-status"],
    queryFn: fetchPolicyStatus,
    retry: 1,
    staleTime: 30_000,
  });

  if (statusQ.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (statusQ.isError) {
    return <Outlet />;
  }

  const pending = !statusQ.data?.all_accepted;

  if (pending && !onLegal && !onAcceptance) {
    return <Navigate to="/policy-acceptance" replace state={{ from: location.pathname }} />;
  }

  if (!pending && onAcceptance) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
