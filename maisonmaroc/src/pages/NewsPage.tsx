import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import NewsArticleCard from "../components/news/NewsArticleCard";
import NewsFeaturedArticle from "../components/news/NewsFeaturedArticle";
import { fetchNews, type NewsArticle } from "../lib/contentApi";
import { NEWS_FR } from "../data/newsCopy.fr";

function frenchFields(article: NewsArticle) {
  return {
    title: article.title.fr,
    excerpt: article.summary.fr || article.body.fr.slice(0, 180).trim() + (article.body.fr.length > 180 ? "…" : ""),
  };
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchNews();
      if (cancelled) return;
      if (res.error || !res.data) setError(true);
      else setArticles(res.data.articles);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [featured, ...rest] = articles;

  return (
    <div className="page-shell bg-[#faf9f7] pb-16">
      <PageMeta
        title={NEWS_FR.metaListTitle}
        description={NEWS_FR.metaListDescription}
        path="/actualites"
      />
      <div className="home-container max-w-6xl">
        <PageHeader title={NEWS_FR.title} description={NEWS_FR.intro} />

        {loading && <p className="mt-10 text-ink-600">{NEWS_FR.loading}</p>}
        {error && !loading && <p className="mt-10 text-red-800">{NEWS_FR.error}</p>}
        {!loading && !error && articles.length === 0 && (
          <p className="mt-10 rounded-xl border border-ink-200 bg-white px-6 py-10 text-center text-ink-600">
            {NEWS_FR.empty}
          </p>
        )}

        {!loading && !error && featured && (
          <div className="mt-10">
            <NewsFeaturedArticle article={featured} {...frenchFields(featured)} />
          </div>
        )}

        {!loading && !error && rest.length > 0 && (
          <section className="mt-14" aria-labelledby="news-grid-heading">
            <h2 id="news-grid-heading" className="home-section-title text-xl sm:text-2xl">
              {NEWS_FR.recentArticles}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <li key={article.id}>
                  <NewsArticleCard article={article} {...frenchFields(article)} compact />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
