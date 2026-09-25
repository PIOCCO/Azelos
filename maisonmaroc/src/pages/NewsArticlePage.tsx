import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageMeta from "../components/PageMeta";
import SmartImage from "../components/SmartImage";
import NewsArticleCard from "../components/news/NewsArticleCard";
import { fetchNews, fetchNewsArticle, type NewsArticle } from "../lib/contentApi";
import { formatDate } from "../lib/format";
import { NEWS_FR } from "../data/newsCopy.fr";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function frenchFields(article: NewsArticle) {
  return {
    title: article.title.fr,
    excerpt: article.summary.fr || "",
  };
}

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [recent, setRecent] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug || !SLUG_RE.test(slug) || slug.length > 120) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [articleRes, listRes] = await Promise.all([fetchNewsArticle(slug), fetchNews()]);
      if (cancelled) return;
      if (articleRes.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (articleRes.error || !articleRes.data?.article) {
        setError(true);
        setLoading(false);
        return;
      }
      setArticle(articleRes.data.article);
      if (listRes.data?.articles) {
        setRecent(listRes.data.articles.filter((a) => a.slug !== slug).slice(0, 3));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const metaDescription = useMemo(() => {
    if (!article) return NEWS_FR.metaListDescription;
    const s = article.summary.fr || article.body.fr;
    return s.slice(0, 160).trim() + (s.length > 160 ? "…" : "");
  }, [article]);

  if (loading) {
    return (
      <div className="page-shell bg-[#faf9f7] pb-16">
        <div className="home-container max-w-3xl py-16 text-ink-600">{NEWS_FR.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell bg-[#faf9f7] pb-16">
        <div className="home-container max-w-3xl py-16 text-red-800">{NEWS_FR.error}</div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="page-shell bg-[#faf9f7] pb-16">
        <PageMeta title={NEWS_FR.notFound} description={NEWS_FR.metaListDescription} path="/actualites" />
        <div className="home-container flex max-w-3xl flex-col items-start gap-6 py-20">
          <p className="home-section-title text-xl">{NEWS_FR.notFound}</p>
          <Link to="/actualites" className="home-btn home-btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> {NEWS_FR.backToNews}
          </Link>
        </div>
      </div>
    );
  }

  const title = article.title.fr;
  const body = article.body.fr;

  return (
    <article className="page-shell bg-[#faf9f7] pb-16">
      <PageMeta
        title={`${title} — APIO`}
        description={metaDescription}
        path={`/actualites/${article.slug}`}
        imageUrl={article.imageUrl}
        ogType="article"
      />
      <div className="home-container max-w-3xl">
        <Link to="/actualites" className="home-text-link inline-flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> {NEWS_FR.backToNews}
        </Link>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">{NEWS_FR.categoryDefault}</p>
        <time className="mt-2 block text-sm font-semibold text-ink-500" dateTime={article.publishedAt}>
          {NEWS_FR.publishedOn} {formatDate(article.publishedAt, "fr")}
        </time>
        <h1 className="home-display-title mt-4 text-navy">{title}</h1>
        {article.author && (
          <p className="mt-3 text-sm text-ink-500">
            {NEWS_FR.source} : {article.author}
          </p>
        )}
        {article.imageUrl && (
          <SmartImage
            src={article.imageUrl}
            alt=""
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-sm"
            fallbackSeed={article.slug}
          />
        )}
        <div className="inst-news-body mt-10 whitespace-pre-wrap text-base leading-relaxed text-ink-800">{body}</div>
      </div>

      {recent.length > 0 && (
        <section className="home-container mt-16 max-w-6xl" aria-labelledby="related-news">
          <h2 id="related-news" className="home-section-title text-xl sm:text-2xl">
            {NEWS_FR.recentArticles}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((a) => (
              <li key={a.id}>
                <NewsArticleCard article={a} {...frenchFields(a)} compact />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
