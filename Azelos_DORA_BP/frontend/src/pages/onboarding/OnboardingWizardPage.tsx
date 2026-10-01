import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getApplicability, getProfile, patchProfile } from "../../api/dora";
import { useOrg } from "../../contexts/OrgContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LoadingSkeleton } from "../../components/ui/States";

const STEPS = ["Profile", "Applicability", "Next actions"] as const;

export function OnboardingWizardPage() {
  const { organizationId } = useOrg();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const profileQ = useQuery({
    queryKey: ["profile", organizationId],
    queryFn: () => getProfile(organizationId!),
    enabled: !!organizationId,
  });
  const appQ = useQuery({
    queryKey: ["applicability", organizationId],
    queryFn: () => getApplicability(organizationId!),
    enabled: !!organizationId && step >= 1,
  });
  const patchM = useMutation({
    mutationFn: () =>
      patchProfile(organizationId!, {
        organization_type: profileQ.data?.organization_type ?? "credit_institution",
        regulatory_status: profileQ.data?.regulatory_status ?? "subject_to_dora",
      }),
  });

  if (!organizationId) {
    return <p className="text-sm text-gray-600">Select an organization after login.</p>;
  }
  if (profileQ.isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div>
      <PageHeader title="Get started" subtitle="Configure your organization for DORA workflows." />
      <div className="mb-4 flex gap-2 text-sm">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`rounded px-2 py-1 ${i === step ? "bg-primary text-white" : "bg-gray-100"}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>
      {step === 0 && (
        <Card title="Organization profile">
          <p className="mb-4 text-sm text-gray-600">
            Confirm regulatory profile so applicability rules can enable the right modules.
          </p>
          <Button
            type="button"
            onClick={() => patchM.mutate(undefined, { onSuccess: () => setStep(1) })}
            disabled={patchM.isPending}
          >
            Save & continue
          </Button>
        </Card>
      )}
      {step === 1 && (
        <Card title="Applicability">
          {appQ.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : (
            <ul className="mb-4 list-disc pl-5 text-sm">
              {(appQ.data?.modules ?? [])
                .filter((m) => m.applicable)
                .map((m) => (
                  <li key={m.key}>
                    {m.name} ({m.key})
                  </li>
                ))}
            </ul>
          )}
          <Button type="button" onClick={() => setStep(2)}>
            Continue
          </Button>
        </Card>
      )}
      {step === 2 && (
        <Card title="Recommended next steps">
          <p className="mb-3 text-sm text-gray-600">
            Build your ICT chain in order: provider → contract → service → business function →
            risk → requirements → evidence.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              <Link className="text-primary underline" to="/ict-providers">
                Add ICT providers
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/contracts">
                Create contracts
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/ict-services">
                Register ICT services
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/business-functions">
                Register business functions
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/dependencies">
                Link functions to services
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/risks">
                Record risk assessments
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/requirements">
                Track DORA requirements
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/evidence">
                Upload evidence
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/dora/relationship-map">
                Review relationship map
              </Link>
            </li>
          </ol>
          <Button type="button" className="mt-4" onClick={() => navigate("/")}>
            Go to dashboard
          </Button>
        </Card>
      )}
    </div>
  );
}
