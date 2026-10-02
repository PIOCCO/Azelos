import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchPaginated } from "../api/dora";
import { useAuth } from "../contexts/AuthContext";

export function usePaginatedResource<T>(
  key: string,
  path: string,
  pageSize = 20,
  options?: { search?: string },
) {
  const { session } = useAuth();
  const organizationId = session?.organizationId ?? null;
  const enabled = !!session?.token && !!organizationId;
  const [page, setPage] = useState(1);
  const search = options?.search ?? "";
  const q = useQuery({
    queryKey: [key, organizationId, path, page, pageSize, search],
    queryFn: () => fetchPaginated<T>(path, page, pageSize, search),
    enabled,
  });
  const isLoading = q.isLoading || (enabled && q.isPending && q.data === undefined);
  return { ...q, isLoading, page, setPage, pageSize, search };
}
