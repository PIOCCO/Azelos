import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearUnauthorizedHandler, setUnauthorizedHandler } from "../../api/authHandler";
import { useAuth } from "../../contexts/AuthContext";

/** Wire API 401 → logout, clear server cache, redirect to login. */
export function AuthSessionSync() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      qc.clear();
      navigate("/login", { replace: true });
    });
    return () => clearUnauthorizedHandler();
  }, [logout, navigate, qc]);

  return null;
}
