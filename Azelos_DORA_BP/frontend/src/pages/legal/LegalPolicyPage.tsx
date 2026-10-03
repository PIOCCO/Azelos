import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchPolicyDocument } from "../../api/policies";
import { LoadingSkeleton, ErrorState } from "../../components/ui/States";
import { useTranslation } from "../../i18n/LocaleContext";

export function LegalPolicyPage() {
  const { policyKey = "" } = useParams<{ policyKey: string }>();
  const { locale, t } = useTranslation();

  const docQ = useQuery({
    queryKey: ["policy-doc", policyKey, locale],
    queryFn: () => fetchPolicyDocument(policyKey, locale),
    enabled: !!policyKey,
  });

  if (docQ.isLoading) return <LoadingSkeleton rows={8} />;
  if (docQ.isError) {
    return (
      <ErrorState
        message={docQ.error instanceof Error ? docQ.error.message : t("errors.loadFailed")}
        onRetry={() => docQ.refetch()}
      />
    );
  }

  const doc = docQ.data!;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="mb-4 text-sm">
        <Link to="/policy-acceptance" className="text-primary hover:underline">
          ← {t("policies.backToAcceptance")}
        </Link>
      </p>
      <article className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
        <h1 className="text-xl font-semibold text-gray-900">{doc.title}</h1>
        <p className="text-xs text-gray-500">
          {t("policies.versionLabel")}: {doc.version}
        </p>
        {doc.content_markdown.replace(/^# .+\n\n?/, "")}
      </article>
    </div>
  );
}
