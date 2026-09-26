import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageMeta from "../components/PageMeta";
import SmartImage from "../components/SmartImage";
import NewsArticleCard from "../components/news/NewsArticleCard";
import NewsListSkeleton from "../components/news/NewsListSkeleton";
import { fetchNewsArticle, type NewsArticle } from "../lib/contentApi";
import { newsCategoryLabel } from "../lib/newsCategories";
import { formatDate } from "../lib/format";
import { useLocale } from "../lib/useLocale";
import { apiMediaUrl } from "../lib/api";
import { CANONICAL_ORIGIN } from "../config/site";
import { NEWS_FR } from "../data/newsCopy.fr";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function articleFields(article: NewsArticle, lang: "fr" | "ar") {
  const title = lang === "ar" ? article.title.ar : article.title.fr;
  const summary = lang === "ar" ? article.summary.ar : article.summary.fr;
  const body = lang === "ar" ? article.body.ar : article.body.fr;
  const excerpt = summary.trim() || body.slice(0, 160).trim() + (body.length > 160 ? "…" : "");
  return { title, body, excerpt };
}

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLocale();
  const copy = NEWS_FR;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
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
      setLoading(true);
      setError(false);
      const articleRes = await fetchNewsArticle(slug);
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
      setRelated(articleRes.data.related ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const fields = article ? articleFields(article, lang) : null;
  const categoryLabel = article ? newsCategoryLabel(article.category, lang) : "";

  const metaDescription = fields?.excerpt || copy.metaListDescription;
  const ogImage = article?.imageUrl ? apiMediaUrl(article.imageUrl) : undefined;

  const jsonLd = useMemo(() => {
    if (!article || !fields) return undefined;
    const origin = CANONICAL_ORIGIN || (typeof window !== "undefined" ? window.location.origin : "");
    const url = `${origin}/actualites/${article.slug}`;
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: fields.title,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: article.author
        ? { "@type": "Organization", name: article.author }
        : { "@type": "Organization", name: "APIO" },
      image: ogImage ? [ogImage] : undefined,
      mainEntityOfPage: url,
      articleSection: categoryLabel,
    };
  }, [article, fields, categoryLabel, ogImage]);

  if (loading) {
    return (
      <div className="page-shell bg-[#faf9f7] pb-16">
        <div className="home-container max-w-6xl py-10">
          <NewsListSkeleton cards={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell bg-[#faf9f7] pb-16">
        <div className="home-container max-w-3xl py-16 text-center">
          <p className="text-red-800">{copy.error}</p>
          <button type="button" className="btn-primary mt-4" onClick={() => window.location.reload()}>
            {copy.retry}
          </button>
        </div>
      </div>
    );
  }

  if (notFound || !article || !fields) {
    return (
      <div className="page-shell bg-[#faf9f7] pb-16">
        <PageMeta title={copy.notFound} description={copy.metaListDescription} path="/actualites" />
        <div className="home-container flex max-w-3xl flex-col items-start gap-6 py-20">
          <p className="home-section-title text-xl">{copy.notFound}</p>
          <Link to="/actualites" className="home-btn home-btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> {copy.backToNews}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="page-shell bg-[#faf9f7] pb-16">
      <PageMeta
        title={`${fields.title} — APIO`}
        description={metaDescription}
        path={`/actualites/${article.slug}`}
        imageUrl={ogImage}
        ogType="article"
        jsonLd={jsonLd}
      />
      <div className="home-container max-w-3xl">
        <Link to="/actualites" className="home-text-link inline-flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> {copy.backToNews}
        </Link>

        <span className="mt-6 inline-flex rounded-full bg-[#f5f2ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-navy/70">
          {categoryLabel}
        </span>
        <time className="mt-4 block text-sm font-semibold text-ink-500" dateTime={article.publishedAt}>
          {copy.publishedOn} {formatDate(article.publishedAt, lang)}
        </time>
        <h1 className="home-display-title mt-4 text-navy">{fields.title}</h1>
        {article.author && (
          <p className="mt-3 text-sm text-ink-500">
            {copy.source} : {article.author}
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
        <div className="inst-news-body mt-10 whitespace-pre-wrap text-base leading-relaxed text-ink-800">
          {fields.body}
        </div>
      </div>

      {related.length > 0 && (
        <section className="home-container mt-16 max-w-6xl" aria-labelledby="related-news">
          <h2 id="related-news" className="home-section-title text-xl sm:text-2xl">
            {copy.relatedArticles}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <li key={a.id}>
                <NewsArticleCard
                  article={a}
                  {...articleFields(a, lang)}
                  categoryLabel={newsCategoryLabel(a.category, lang)}
                  compact
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
