import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchPaginated } from "../api/dora";

export function usePaginatedResource<T>(
  key: string,
  path: string,
  pageSize = 20,
  options?: { search?: string },
) {
  const [page, setPage] = useState(1);
  const search = options?.search ?? "";
  const q = useQuery({
    queryKey: [key, path, page, pageSize, search],
    queryFn: () => fetchPaginated<T>(path, page, pageSize, search),
  });
  return { ...q, page, setPage, pageSize, search };
}
