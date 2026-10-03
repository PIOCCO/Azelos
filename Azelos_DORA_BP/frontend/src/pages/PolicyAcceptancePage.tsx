import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { acceptPolicies, fetchPolicyStatus } from "../api/policies";
import { Button } from "../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../components/ui/States";
import { useTranslation } from "../i18n/LocaleContext";

const POLICY_LINKS = [
  { key: "terms_of_service", labelKey: "policies.linkTerms" },
  { key: "privacy_policy", labelKey: "policies.linkPrivacy" },
  { key: "data_loss_service_disclaimer", labelKey: "policies.linkDataLoss" },
  { key: "acceptable_use", labelKey: "policies.linkAcceptableUse" },
  { key: "security_responsibility", labelKey: "policies.linkSecurity" },
] as const;

export function PolicyAcceptancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checks, setChecks] = useState({
    terms: false,
    privacy: false,
    dataLoss: false,
    dataResponsibility: false,
  });

  const statusQ = useQuery({
    queryKey: ["policy-status"],
    queryFn: fetchPolicyStatus,
    staleTime: 0,
  });

  const acceptM = useMutation({
    mutationFn: acceptPolicies,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["policy-status"] });
      navigate("/", { replace: true });
    },
  });

  const allChecked = checks.terms && checks.privacy && checks.dataLoss && checks.dataResponsibility;

  if (statusQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (statusQ.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <ErrorState
          message={statusQ.error instanceof Error ? statusQ.error.message : t("errors.loadFailed")}
          onRetry={() => statusQ.refetch()}
        />
      </div>
    );
  }

  if (statusQ.data?.all_accepted) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">{t("policies.acceptanceTitle")}</h1>
        <p className="mt-2 text-sm text-gray-600">{t("policies.acceptanceIntro")}</p>
        <p className="mt-1 text-xs text-gray-500">{t("policies.legalNotice")}</p>

        <div className="mt-6 space-y-3 text-sm text-gray-800">
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={checks.terms}
              onChange={(e) => setChecks((c) => ({ ...c, terms: e.target.checked }))}
            />
            <span>{t("policies.checkboxTerms")}</span>
          </label>
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={checks.privacy}
              onChange={(e) => setChecks((c) => ({ ...c, privacy: e.target.checked }))}
            />
            <span>{t("policies.checkboxPrivacy")}</span>
          </label>
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={checks.dataLoss}
              onChange={(e) => setChecks((c) => ({ ...c, dataLoss: e.target.checked }))}
            />
            <span>{t("policies.checkboxDataLoss")}</span>
          </label>
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={checks.dataResponsibility}
              onChange={(e) => setChecks((c) => ({ ...c, dataResponsibility: e.target.checked }))}
            />
            <span>{t("policies.checkboxDataResponsibility")}</span>
          </label>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700">{t("policies.viewPolicies")}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {POLICY_LINKS.map((p) => (
              <li key={p.key}>
                <Link className="text-primary hover:underline" to={`/legal/${p.key}`}>
                  {t(p.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {acceptM.isError ? (
          <p className="mt-4 text-sm text-red-600">
            {acceptM.error instanceof Error ? acceptM.error.message : t("policies.acceptFailed")}
          </p>
        ) : null}

        <Button
          type="button"
          className="mt-6 w-full"
          disabled={!allChecked || acceptM.isPending}
          onClick={() => acceptM.mutate()}
        >
          {acceptM.isPending ? t("common.loading") : t("policies.acceptAndContinue")}
        </Button>
      </div>
    </div>
  );
}
