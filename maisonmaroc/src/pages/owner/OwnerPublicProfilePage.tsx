import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { apiFetch } from "../../lib/api";
import type { OwnerProfileBundle } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import { PortalError, PortalLoading } from "../../components/owner/PortalStates";

export default function OwnerPublicProfilePage() {
  const { t } = useLocale();
  const [bundle, setBundle] = useState<OwnerProfileBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await apiFetch<OwnerProfileBundle>("/api/owner/profile");
    if (err) setError(err);
    else setBundle(data ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !bundle) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.publicProfile")}</h1>
        <div className="mt-6">
          <PortalError message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.publicProfile")}</h1>
        <div className="mt-6">
          <PortalLoading />
        </div>
      </div>
    );
  }

  const publicPath = bundle.publicProfilePath;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.publicProfile")}</h1>
      <p className="text-sm text-ink-600">{t("ownerPortal.publicPreviewHint")}</p>
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <Link to={publicPath} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
          <ExternalLink size={16} aria-hidden />
          {t("ownerPortal.viewPublicProfile")}
        </Link>
        <p className="mt-4 text-xs text-ink-500">{t("ownerPortal.publicPreviewNote")}</p>
      </div>
    </div>
  );
}
