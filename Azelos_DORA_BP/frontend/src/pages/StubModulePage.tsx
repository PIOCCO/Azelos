import { useQuery } from "@tanstack/react-query";
import { probeStubEndpoint } from "../api/dora";
import { LoadingPanel, ErrorPanel } from "../components/ui/StatePanel";

export function StubModulePage({ title, apiPath }: { title: string; apiPath: string }) {
  const q = useQuery({
    queryKey: ["stub", apiPath],
    queryFn: () => probeStubEndpoint(apiPath),
  });

  if (q.isLoading) return <LoadingPanel />;
  if (q.error) {
    return <ErrorPanel message={(q.error as Error).message} />;
  }

  const result = q.data;
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {result?.ok ? (
        <p className="mt-4 text-green-800">Backend reports this module as available.</p>
      ) : (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Not available yet</p>
          <p className="mt-2">{result?.message ?? "Server returned 501 — entity not modelled."}</p>
        </div>
      )}
    </div>
  );
}
