import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchPaginated } from "../api/dora";

export function usePaginatedResource<T>(key: string, path: string, pageSize = 20) {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: [key, path, page, pageSize],
    queryFn: () => fetchPaginated<T>(path, page, pageSize),
  });
  return { ...q, page, setPage, pageSize };
}
