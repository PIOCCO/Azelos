import { Navigate } from "react-router-dom";

/** Legacy routes — client auth only (no public owner registration). */
export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  return <Navigate to={mode === "login" ? "/client/login" : "/client/register"} replace />;
}
