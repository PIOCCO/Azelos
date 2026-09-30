import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  detailPathForNode,
  graphNodeEntityUuid,
  graphNodeToEntityTypeGql,
  graphSearch,
  type GraphNode,
} from "../../api/graphql";

export function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(t);
  }, [query]);

  const searchQ = useQuery({
    queryKey: ["global-graph-search", debounced],
    queryFn: () => graphSearch(debounced, 12),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = (n: GraphNode, mode: "graph" | "list") => {
    setOpen(false);
    setQuery(n.label);
    if (mode === "graph") {
      navigate("/dora/relationship-map", {
        state: {
          gqlType: graphNodeToEntityTypeGql(n.type),
          entityId: graphNodeEntityUuid(n),
          label: n.label,
          autoLoad: true,
        },
      });
      return;
    }
    const path = detailPathForNode(n);
    if (path) navigate(path);
    else pick(n, "graph");
  };

  const showDropdown = open && debounced.length >= 2;

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-xl">
      <label className="relative block">
        <span className="sr-only">Search assets, risks, providers</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchQ.data?.[0]) {
              e.preventDefault();
              pick(searchQ.data[0], "graph");
            }
          }}
          placeholder="Search assets, risks, providers…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400"
          autoComplete="off"
        />
      </label>
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {searchQ.isLoading ? (
            <p className="px-3 py-2 text-sm text-gray-500">Searching…</p>
          ) : searchQ.isError ? (
            <p className="px-3 py-2 text-sm text-red-600">
              {(searchQ.error as Error).message.includes("Authentication")
                ? "Sign in required"
                : "Search unavailable — is GraphQL enabled on the backend?"}
            </p>
          ) : !searchQ.data?.length ? (
            <p className="px-3 py-2 text-sm text-gray-500">No matches in your organization.</p>
          ) : (
            searchQ.data.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left text-sm"
                  onClick={() => pick(n, "graph")}
                >
                  <span className="font-medium text-gray-900">{n.label}</span>
                  <span className="ml-2 text-xs text-gray-500">{n.type}</span>
                </button>
                {detailPathForNode(n) ? (
                  <button
                    type="button"
                    className="shrink-0 text-xs text-primary hover:underline"
                    onClick={() => pick(n, "list")}
                  >
                    Open list
                  </button>
                ) : null}
              </div>
            ))
          )}
          <p className="border-t px-3 py-2 text-[11px] text-gray-400">
            Powered by GraphQL · opens Relationship Map on select
          </p>
        </div>
      ) : null}
    </div>
  );
}
