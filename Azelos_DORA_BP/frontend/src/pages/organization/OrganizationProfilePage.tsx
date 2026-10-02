import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/client";
import { getOrganization, patchOrganization, patchProfile } from "../../api/dora";
import { useAuth } from "../../contexts/AuthContext";
import { useOrg } from "../../contexts/OrgContext";
import { can, isReadOnlyAuditor } from "../../lib/permissions";
import {
  ORGANIZATION_TYPES,
  REGULATORY_STATUSES,
  SIZE_CATEGORIES,
  labelEnum,
} from "../../lib/profileEnums";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorPanel, LoadingPanel } from "../../components/ui/StatePanel";
import { Button } from "../../components/ui/Button";

/**
 * Organization identity + regulatory context (who this financial entity is).
 * Platform configuration lives under Settings — not here.
 */
export function OrganizationProfilePage() {
  const { session } = useAuth();
  const { organizationId, profile, applicability, isLoading, error: orgError, refreshOrg } = useOrg();
  const readOnly = isReadOnlyAuditor(session?.role) || !can(session?.role, "org.admin");
  const [identityMsg, setIdentityMsg] = useState<string | null>(null);
  const [regulatoryMsg, setRegulatoryMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orgQ = useQuery({
    queryKey: ["org", organizationId, "entity-detail"],
    queryFn: () => getOrganization(organizationId!),
    enabled: !!organizationId,
  });

  if (isLoading || orgQ.isLoading) return <LoadingPanel label="Loading organization…" />;
  if (orgError) return <ErrorPanel message={orgError.message} />;
  if (orgQ.error) return <ErrorPanel message={(orgQ.error as Error).message} />;
  if (!profile || !orgQ.data) {
    return (
      <ErrorPanel message="Organization profile is not available. Check your login organization or contact an administrator." />
    );
  }

  const org = orgQ.data;

  async function onIdentitySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!organizationId || readOnly) return;
    setError(null);
    setIdentityMsg(null);
    const fd = new FormData(e.currentTarget);
    try {
      await patchOrganization(organizationId, {
        legal_name: String(fd.get("legal_name")),
        short_name: String(fd.get("short_name") || "") || null,
      });
      await orgQ.refetch();
      setIdentityMsg("Organization identity saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function onRegulatorySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!organizationId || readOnly) return;
    setError(null);
    setRegulatoryMsg(null);
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
      setRegulatoryMsg("Regulatory profile saved. Module applicability is recalculated by the platform.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Organization profile"
        subtitle="Who your organization is and how it is classified for DORA — not platform wiring or integrations."
      />
      {readOnly ? (
        <p className="text-sm text-amber-800">Read-only for your role. Contact an organization administrator to edit.</p>
      ) : null}
      {error ? <ErrorPanel message={error} /> : null}

      <Card title="Organization identity">
        <p className="mb-4 text-sm text-gray-600">
          Legal entity details used across registers, contracts, and reporting. Country and LEI are set at provisioning;
          contact your platform operator to change them if needed.
        </p>
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Tenant ID</dt>
            <dd className="font-mono text-xs text-gray-800">{org.id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Country</dt>
            <dd>{org.country_code}</dd>
          </div>
          <div>
            <dt className="text-gray-500">LEI</dt>
            <dd>{org.lei ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd className="capitalize">{org.status}</dd>
          </div>
        </dl>
        <form onSubmit={onIdentitySubmit} className="space-y-3">
          {identityMsg ? <p className="text-sm text-green-800">{identityMsg}</p> : null}
          <label className="block text-sm">
            Legal name
            <input
              name="legal_name"
              required
              disabled={readOnly}
              defaultValue={org.legal_name}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Trading / short name
            <input
              name="short_name"
              disabled={readOnly}
              defaultValue={org.short_name ?? ""}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          {!readOnly ? (
            <Button type="submit" variant="primary" className="text-sm">
              Save identity
            </Button>
          ) : null}
        </form>
      </Card>

      <Card title="Regulatory & DORA context">
        <p className="mb-4 text-sm text-gray-600">
          These attributes drive backend applicability rules and which DORA modules apply to your organization. To review
          the outcome, see{" "}
          <Link to="/onboarding/applicability" className="text-primary underline">
            Applicability
          </Link>{" "}
          or configure modules under{" "}
          <Link to="/settings/dora" className="text-primary underline">
            Settings → DORA configuration
          </Link>
          .
        </p>
        {(applicability?.rules?.length ?? 0) > 0 ? (
          <p className="mb-3 text-xs text-gray-500">
            Matched rules: {applicability!.rules.join(", ")}
          </p>
        ) : null}
        <form onSubmit={onRegulatorySubmit} className="space-y-3">
          {regulatoryMsg ? <p className="text-sm text-green-800">{regulatoryMsg}</p> : null}
          <label className="block text-sm">
            Financial entity type
            <select
              name="organization_type"
              disabled={readOnly}
              defaultValue={profile.organization_type}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
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
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
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
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {REGULATORY_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {labelEnum(v)}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="art16_eligible"
                disabled={readOnly}
                defaultChecked={profile.art16_eligible}
              />
              Article 16 micro-institution eligibility
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="has_critical_functions"
                disabled={readOnly}
                defaultChecked={profile.has_critical_functions}
              />
              Organization declares critical or important functions
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="tlpt_applicable"
                disabled={readOnly}
                defaultChecked={profile.tlpt_applicable}
              />
              TLPT in scope (threat-led penetration testing)
            </label>
          </div>
          {!readOnly ? (
            <Button type="submit" variant="primary" className="text-sm">
              Save regulatory profile
            </Button>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
