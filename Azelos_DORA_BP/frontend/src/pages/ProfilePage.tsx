import { Navigate } from "react-router-dom";

/** Legacy route — organization identity lives at /organization/profile. */
export function ProfilePage() {
  return <Navigate to="/organization/profile" replace />;
}
