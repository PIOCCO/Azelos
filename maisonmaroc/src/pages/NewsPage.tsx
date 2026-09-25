import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../lib/useLocale";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import { fetchNews, type NewsArticle } from "../lib/contentApi";
import { formatDate } from "../lib/format";

export default function NewsPage() {
  const { t, L, lang } = useLocale();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchNews();
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setArticles(res.data?.articles ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell">
      <PageMeta title={t("inst.news.metaTitle")} description={t("inst.news.description")} path="/actualites" />
      <div className="container-page pb-16">
        <PageHeader title={t("inst.nav.news")} description={t("inst.news.description")} />
        {loading && <p className="text-ink-600">{t("common.loading")}</p>}
        {error && <p className="text-red-700">{error}</p>}
        {!loading && !error && articles.length === 0 && (
          <p className="text-ink-600">{t("inst.news.empty")}</p>
        )}
        <ul className="divide-y divide-ink-100">
          {articles.map((a) => (
            <li key={a.id} className="py-6">
              <article>
                <time className="text-xs font-semibold uppercase tracking-wide text-ink-500" dateTime={a.publishedAt}>
                  {formatDate(a.publishedAt, lang)}
                </time>
                <h2 className="mt-1 font-display text-xl font-bold text-navy-800">
                  <Link to={`/actualites/${a.slug}`} className="hover:text-brand-700">
                    {L(a.title)}
                  </Link>
                </h2>
                {L(a.summary) && <p className="mt-2 max-w-3xl text-sm text-ink-600">{L(a.summary)}</p>}
                <Link to={`/actualites/${a.slug}`} className="mt-2 inline-block text-sm font-semibold text-brand-700">
                  {t("common.viewMore")}
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
