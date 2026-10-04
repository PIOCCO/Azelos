import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchLicenseStatus } from "../../api/license";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { useTranslation } from "../../i18n/LocaleContext";

export function LicenseBanner() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const isAdmin = can(session?.role, "org.admin");
  const q = useQuery({
    queryKey: ["license-status"],
    queryFn: fetchLicenseStatus,
    enabled: Boolean(session?.token),
    staleTime: 60_000,
  });

  const data = q.data;
  if (!data || !data.enforcement_enabled) return null;

  const expired = data.read_only && data.effective_status === "EXPIRED";
  const revoked = data.effective_status === "REVOKED" || data.effective_status === "SUSPENDED";
  const warn = data.warnings?.length > 0;
  if (!expired && !revoked && !warn && data.validation_ok && !data.read_only) return null;

  const tone = expired || revoked ? "border-red-300 bg-red-50 text-red-900" : "border-amber-300 bg-amber-50 text-amber-950";

  return (
    <div className={`border-b px-4 py-2 text-sm ${tone}`} role="status">
      {expired ? (
        <p>
          {t("license.expiredReadOnly")}{" "}
          {isAdmin ? (
            <Link className="font-medium underline" to="/settings/license">
              {t("license.viewLicense")}
            </Link>
          ) : null}
        </p>
      ) : revoked ? (
        <p>{data.message ?? t("license.revoked")}</p>
      ) : !data.validation_ok ? (
        <p>{data.message ?? t("license.invalid")}</p>
      ) : (
        <p>{data.warnings[0]}</p>
      )}
    </div>
  );
}
