import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLocale } from "../lib/useLocale";
import PageMeta from "../components/PageMeta";
import SmartImage from "../components/SmartImage";
import { fetchNewsArticle, type NewsArticle } from "../lib/contentApi";
import { formatDate } from "../lib/format";

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, L, lang } = useLocale();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const res = await fetchNewsArticle(slug);
      if (cancelled) return;
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (res.data?.article) setArticle(res.data.article);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container-page py-16 text-ink-600">{t("common.loading")}</div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-lg font-semibold">{t("inst.news.notFound")}</p>
        <Link to="/actualites" className="btn-primary">
          {t("inst.nav.news")}
        </Link>
      </div>
    );
  }

  const title = L(article.title);
  const body = L(article.body);

  return (
    <article className="page-shell pb-16">
      <PageMeta title={title} description={L(article.summary) || body.slice(0, 160)} path={`/actualites/${article.slug}`} />
      <div className="container-page max-w-3xl">
        <Link to="/actualites" className="text-sm font-semibold text-brand-700 hover:underline">
          ← {t("inst.nav.news")}
        </Link>
        <time className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-500" dateTime={article.publishedAt}>
          {formatDate(article.publishedAt, lang)}
        </time>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-navy-900">{title}</h1>
        {article.author && (
          <p className="mt-2 text-sm text-ink-500">
            {t("inst.news.author")}: {article.author}
          </p>
        )}
        {article.imageUrl && (
          <SmartImage
            src={article.imageUrl}
            alt=""
            className="mt-6 aspect-[16/9] w-full rounded-xl object-cover"
            fallbackSeed={article.slug}
          />
        )}
        <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-ink-800">{body}</div>
      </div>
    </article>
  );
}
