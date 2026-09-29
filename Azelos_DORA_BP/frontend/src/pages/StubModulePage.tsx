import { useQuery } from "@tanstack/react-query";
import { probeStubEndpoint } from "../api/dora";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { LoadingSkeleton, ErrorState } from "../components/ui/States";

export function StubModulePage({ title, apiPath }: { title: string; apiPath: string }) {
  const q = useQuery({
    queryKey: ["stub", apiPath],
    queryFn: () => probeStubEndpoint(apiPath),
  });

  if (q.isLoading) {
    return (
      <>
        <PageHeader title={title} />
        <LoadingSkeleton rows={3} />
      </>
    );
  }
  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;

  const result = q.data;
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        {result?.ok ? (
          <p className="text-sm text-green-800">Backend reports this module as available.</p>
        ) : (
          <>
            <p className="font-medium text-gray-900">Not available yet</p>
            <p className="mt-2 text-sm text-gray-600">
              {result?.message ?? "Server returned 501 — entity not modelled."}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
