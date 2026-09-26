import { logSecurityEvent } from "./securityLog.js";

const ADMIN_PATH_PREFIXES = ["/api/admin"];

function isPublicAdminPath(path) {
  if (path === "/api/auth/admin/login" || path.startsWith("/api/auth/admin/")) return true;
  return ADMIN_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Hide admin API on the public APIO listener (defense in depth with nginx). */
export function blockPublicAdminAccess() {
  return (req, res, next) => {
    if (isPublicAdminPath(req.path)) {
      logSecurityEvent("public_admin_blocked", { path: req.path, ip: req.ip });
      return res.status(404).json({ error: "Not found" });
    }
    next();
  };
}
