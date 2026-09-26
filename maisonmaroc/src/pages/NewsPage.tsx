import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import NewsArticleCard from "../components/news/NewsArticleCard";
import NewsFeaturedArticle from "../components/news/NewsFeaturedArticle";
import NewsListSkeleton from "../components/news/NewsListSkeleton";
import { fetchNews, fetchNewsCategories, type NewsArticle } from "../lib/contentApi";
import { newsCategoryLabel, NEWS_CATEGORY_IDS, type NewsCategoryId } from "../lib/newsCategories";
import { useLocale } from "../lib/useLocale";
import { NEWS_FR } from "../data/newsCopy.fr";

const PAGE_SIZE = 9;

function articleFields(article: NewsArticle, lang: "fr" | "ar") {
  const title = lang === "ar" ? article.title.ar : article.title.fr;
  const summary = lang === "ar" ? article.summary.ar : article.summary.fr;
  const body = lang === "ar" ? article.body.ar : article.body.fr;
  const excerpt =
    summary.trim() ||
    body.slice(0, 180).trim() + (body.length > 180 ? "…" : "");
  return { title, excerpt };
}

export default function NewsPage() {
  const { lang } = useLocale();
  const copy = NEWS_FR;

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [featured, setFeatured] = useState<NewsArticle | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [categoriesInUse, setCategoriesInUse] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchNewsCategories().then((res) => {
      if (!cancelled && res.data?.inUse) setCategoriesInUse(res.data.inUse);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(false);

      const res = await fetchNews({
        limit: PAGE_SIZE,
        offset: nextOffset,
        category: category || undefined,
        q: searchQuery || undefined,
      });

      if (res.error || !res.data) {
        setError(true);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      setFeatured(res.data.featured);
      setTotal(res.data.total);
      setOffset(nextOffset);
      setArticles((prev) => (append ? [...prev, ...res.data!.articles] : res.data!.articles));
      setLoading(false);
      setLoadingMore(false);
    },
    [category, searchQuery],
  );

  useEffect(() => {
    loadPage(0, false);
  }, [loadPage]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const filterChips = useMemo(() => {
    const ids = categoriesInUse.length
      ? NEWS_CATEGORY_IDS.filter((id) => categoriesInUse.includes(id))
      : [...NEWS_CATEGORY_IDS];
    return ids;
  }, [categoriesInUse]);

  const hasMore = articles.length < total;
  const showEmpty = !loading && !error && total === 0 && !featured;
  const showSearchEmpty = !loading && !error && total === 0 && (searchQuery || category) && !featured;

  const gridArticles = articles;

  return (
    <div className="page-shell bg-[#faf9f7] pb-20">
      <PageMeta
        title={copy.metaListTitle}
        description={copy.metaListDescription}
        path="/actualites"
      />
      <div className="home-container max-w-6xl">
        <PageHeader title={copy.title} description={copy.intro} />

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="input w-full ps-10"
              aria-label={copy.searchPlaceholder}
            />
          </div>
          {!loading && total > 0 && (
            <p className="text-sm font-medium text-ink-500">{copy.resultsCount(total)}</p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Catégories">
          <button
            type="button"
            role="tab"
            aria-selected={!category}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              !category
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
            }`}
            onClick={() => setCategory("")}
          >
            {copy.filterAll}
          </button>
          {filterChips.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={category === id}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                category === id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
              }`}
              onClick={() => setCategory(id === category ? "" : id)}
            >
              {newsCategoryLabel(id as NewsCategoryId, lang)}
            </button>
          ))}
        </div>

        {loading && <div className="mt-10"><NewsListSkeleton /></div>}

        {error && !loading && (
          <div className="mt-10 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-red-800">{copy.error}</p>
            <button type="button" className="btn-primary mt-4" onClick={() => loadPage(0, false)}>
              {copy.retry}
            </button>
          </div>
        )}

        {showEmpty && (
          <p className="mt-10 rounded-xl border border-ink-200 bg-white px-6 py-12 text-center text-ink-600">
            {copy.empty}
          </p>
        )}

        {showSearchEmpty && (
          <p className="mt-10 rounded-xl border border-ink-200 bg-white px-6 py-12 text-center text-ink-600">
            {copy.searchEmpty}
          </p>
        )}

        {!loading && !error && featured && offset === 0 && !searchQuery && !category && (
          <div className="mt-10">
            <NewsFeaturedArticle
              article={featured}
              {...articleFields(featured, lang)}
              categoryLabel={newsCategoryLabel(featured.category, lang)}
            />
          </div>
        )}

        {!loading && !error && gridArticles.length > 0 && (
          <section className="mt-14" aria-labelledby="news-grid-heading">
            <h2 id="news-grid-heading" className="home-section-title text-xl sm:text-2xl">
              {copy.latestSection}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridArticles.map((article) => (
                <li key={article.id} className="motion-safe:transition-transform motion-safe:hover:-translate-y-0.5">
                  <NewsArticleCard
                    article={article}
                    {...articleFields(article, lang)}
                    categoryLabel={newsCategoryLabel(article.category, lang)}
                    compact
                  />
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  className="home-btn home-btn-outline min-w-[200px]"
                  disabled={loadingMore}
                  onClick={() => loadPage(offset + PAGE_SIZE, true)}
                >
                  {loadingMore ? copy.loading : copy.loadMore}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
