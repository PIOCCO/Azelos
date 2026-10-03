import { useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { bestNavigationMatch, searchNavigation } from "../../lib/navSearch";
import { useTranslation } from "../../i18n/LocaleContext";

export function GlobalSearchBar() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const isAdmin = can(session?.role, "org.admin");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const navHits = useMemo(() => {
    if (!debounced) return [];
    return searchNavigation(debounced, {
      isAdmin,
      role: session?.role,
      t,
    });
  }, [debounced, isAdmin, session?.role, t]);

  const searchQ = useQuery({
    queryKey: ["global-graph-search", debounced],
    queryFn: () => graphSearch(debounced, 8),
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

  const goNav = (route: string, label: string) => {
    setOpen(false);
    setQuery(label);
    navigate(route);
  };

  const pickGraph = (n: GraphNode, mode: "graph" | "list") => {
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
    else pickGraph(n, "graph");
  };

  const onSubmitBest = () => {
    const nav = bestNavigationMatch(debounced, { isAdmin, role: session?.role, t });
    if (nav) {
      goNav(nav.entry.route, nav.label);
      return;
    }
    if (searchQ.data?.[0]) {
      pickGraph(searchQ.data[0], "graph");
    }
  };

  const showDropdown = open && debounced.length >= 1;
  const hasNav = navHits.length > 0;
  const graphLoading = debounced.length >= 2 && searchQ.isLoading;
  const hasGraph = (searchQ.data?.length ?? 0) > 0;
  const showEmpty =
    debounced.length >= 1 &&
    !hasNav &&
    debounced.length >= 2 &&
    !graphLoading &&
    !searchQ.isError &&
    !hasGraph;

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-xl">
      <label className="relative block">
        <span className="sr-only">{t("globalSearch.label")}</span>
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
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmitBest();
            }
          }}
          placeholder={t("globalSearch.placeholder")}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400"
          autoComplete="off"
        />
      </label>
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {hasNav ? (
            <div className="pb-1">
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {t("globalSearch.sectionNavigation")}
              </p>
              {navHits.map((hit) => (
                <button
                  key={hit.entry.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
                  onClick={() => goNav(hit.entry.route, hit.label)}
                >
                  {hit.label}
                </button>
              ))}
            </div>
          ) : null}

          {debounced.length >= 2 ? (
            <div className={hasNav ? "border-t pt-1" : ""}>
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {t("globalSearch.sectionData")}
              </p>
              {graphLoading ? (
                <p className="px-3 py-2 text-sm text-gray-500">{t("globalSearch.searching")}</p>
              ) : searchQ.isError ? (
                <p className="px-3 py-2 text-sm text-red-600">
                  {(searchQ.error as Error).message.includes("Authentication")
                    ? t("globalSearch.signInRequired")
                    : t("globalSearch.graphUnavailable")}
                </p>
              ) : hasGraph ? (
                searchQ.data!.map((n) => (
                  <div key={n.id} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left text-sm"
                      onClick={() => pickGraph(n, "graph")}
                    >
                      <span className="font-medium text-gray-900">{n.label}</span>
                      <span className="ml-2 text-xs text-gray-500">{n.type}</span>
                    </button>
                    {detailPathForNode(n) ? (
                      <button
                        type="button"
                        className="shrink-0 text-xs text-primary hover:underline"
                        onClick={() => pickGraph(n, "list")}
                      >
                        {t("globalSearch.openRecord")}
                      </button>
                    ) : null}
                  </div>
                ))
              ) : !hasNav ? null : (
                <p className="px-3 py-2 text-sm text-gray-500">{t("globalSearch.noDataMatches")}</p>
              )}
            </div>
          ) : null}

          {showEmpty ? (
            <p className="px-3 py-2 text-sm text-gray-500">{t("globalSearch.noResults")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
