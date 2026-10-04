import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchLicenseStatusAdmin,
  installLicense,
  replaceLicense,
  type LicenseStatus,
} from "../../api/license";
import { PageHeader } from "../../components/ui/PageHeader";
import { useTranslation } from "../../i18n/LocaleContext";
import { LoadingPanel, ErrorPanel } from "../../components/ui/StatePanel";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}

function StatusBanner({ status }: { status: LicenseStatus }) {
  if (status.effective_status === "EXPIRED" || (status.read_only && status.effective_status === "EXPIRED")) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
        License expired — ADORA is currently in read-only mode.
      </p>
    );
  }
  if (status.read_only) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {status.message ?? "ADORA is in read-only mode."}
      </p>
    );
  }
  if (status.warnings.length > 0) {
    return (
      <ul className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {status.warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    );
  }
  return null;
}

export function SettingsLicensePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [jsonText, setJsonText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["license-status-admin"], queryFn: fetchLicenseStatusAdmin });

  const installMut = useMutation({
    mutationFn: (envelope: unknown) => installLicense(envelope),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["license-status"] });
      qc.invalidateQueries({ queryKey: ["license-status-admin"] });
      setJsonText("");
      setFormError(null);
    },
  });

  const replaceMut = useMutation({
    mutationFn: (envelope: unknown) => replaceLicense(envelope),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["license-status"] });
      qc.invalidateQueries({ queryKey: ["license-status-admin"] });
      setJsonText("");
      setFormError(null);
    },
  });

  if (q.isLoading) return <LoadingPanel />;
  if (q.error) return <ErrorPanel message={(q.error as Error).message} />;
  const status = q.data!;

  const onInstall = (mode: "install" | "replace") => {
    try {
      const envelope = JSON.parse(jsonText);
      if (mode === "install") installMut.mutate(envelope);
      else replaceMut.mutate(envelope);
    } catch {
      setFormError(t("license.invalidJson"));
    }
  };

  return (
    <div>
      <PageHeader title={t("license.title")} subtitle={t("license.subtitle")} />
      <div className="mt-6 space-y-6">
        <StatusBanner status={status} />
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("license.status")} value={status.effective_status ?? (status.validation_ok ? "ACTIVE" : "INVALID")} />
          <Field label={t("license.plan")} value={status.plan} />
          <Field label={t("license.customer")} value={status.customer_name} />
          <Field label={t("license.licenseId")} value={status.license_id} />
          <Field label={t("license.startsAt")} value={status.starts_at} />
          <Field label={t("license.expiresAt")} value={status.expires_at} />
          <Field label={t("license.daysRemaining")} value={status.days_remaining} />
          <Field label={t("license.maxUsers")} value={status.max_users} />
          <Field
            label={t("license.modules")}
            value={
              status.enabled_modules?.length
                ? status.enabled_modules.join(", ")
                : t("license.allModules")
            }
          />
        </dl>

        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-medium">{t("license.installTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("license.installHelp")}</p>
          <textarea
            className="mt-3 w-full rounded border font-mono text-xs"
            rows={8}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"format_version":1,"payload":{...},"signature":"..."}'
          />
          {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-50"
              disabled={!jsonText.trim() || installMut.isPending}
              onClick={() => onInstall("install")}
            >
              {t("license.install")}
            </button>
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={!jsonText.trim() || replaceMut.isPending}
              onClick={() => onInstall("replace")}
            >
              {t("license.replace")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
