import { FormEvent, useState } from "react";
import { ApiError } from "../api/client";
import { patchProfile } from "../api/dora";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { can, isReadOnlyAuditor } from "../lib/permissions";
import {
  ORGANIZATION_TYPES,
  REGULATORY_STATUSES,
  SIZE_CATEGORIES,
  labelEnum,
} from "../lib/profileEnums";
import { ErrorPanel, LoadingPanel } from "../components/ui/StatePanel";

export function ProfilePage() {
  const { session } = useAuth();
  const { organizationId, profile, isLoading, refreshOrg } = useOrg();
  const readOnly = isReadOnlyAuditor(session?.role) || !can(session?.role, "org.admin");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !profile) return <LoadingPanel label="Loading profile…" />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!organizationId || readOnly) return;
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    try {
      await patchProfile(organizationId, {
        organization_type: String(fd.get("organization_type")),
        size_category: String(fd.get("size_category")),
        regulatory_status: String(fd.get("regulatory_status")),
        art16_eligible: fd.get("art16_eligible") === "on",
        has_critical_functions: fd.get("has_critical_functions") === "on",
        tlpt_applicable: fd.get("tlpt_applicable") === "on",
      });
      await refreshOrg();
      setMessage("Profile saved. Applicability and modules refreshed from backend.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Organization profile</h1>
      <p className="mt-1 text-sm text-slate-600">
        Values drive backend applicability only — the UI does not apply sector rules.
      </p>
      {readOnly ? (
        <p className="mt-2 text-sm text-amber-800">Read-only for your role.</p>
      ) : null}
      {message ? <p className="mt-2 text-sm text-green-800">{message}</p> : null}
      {error ? <ErrorPanel message={error} /> : null}
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-lg border bg-white p-4">
        <label className="block text-sm">
          Organization type
          <select
            name="organization_type"
            disabled={readOnly}
            defaultValue={profile.organization_type}
            className="mt-1 w-full rounded border px-2 py-1.5"
          >
            {ORGANIZATION_TYPES.map((v) => (
              <option key={v} value={v}>
                {labelEnum(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Size category
          <select
            name="size_category"
            disabled={readOnly}
            defaultValue={profile.size_category}
            className="mt-1 w-full rounded border px-2 py-1.5"
          >
            {SIZE_CATEGORIES.map((v) => (
              <option key={v} value={v}>
                {labelEnum(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Regulatory status
          <select
            name="regulatory_status"
            disabled={readOnly}
            defaultValue={profile.regulatory_status}
            className="mt-1 w-full rounded border px-2 py-1.5"
          >
            {REGULATORY_STATUSES.map((v) => (
              <option key={v} value={v}>
                {labelEnum(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="art16_eligible"
            disabled={readOnly}
            defaultChecked={profile.art16_eligible}
          />
          Art. 16 eligible (from profile API)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="has_critical_functions"
            disabled={readOnly}
            defaultChecked={profile.has_critical_functions}
          />
          Has critical functions
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="tlpt_applicable"
            disabled={readOnly}
            defaultChecked={profile.tlpt_applicable}
          />
          TLPT applicable (display only — computed by backend rules)
        </label>
        {!readOnly ? (
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            Save profile
          </button>
        ) : null}
      </form>
    </div>
  );
}
