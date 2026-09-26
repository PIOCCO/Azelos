import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SmartImage from "../SmartImage";
import type { NewsArticle } from "../../lib/contentApi";
import { formatDate } from "../../lib/format";
import { NEWS_FR } from "../../data/newsCopy.fr";

type Props = {
  article: NewsArticle;
  title: string;
  excerpt: string;
  categoryLabel?: string;
  compact?: boolean;
};

export default function NewsArticleCard({ article, title, excerpt, categoryLabel, compact }: Props) {
  return (
    <article className="inst-news-card group flex h-full flex-col overflow-hidden rounded-xl border border-ink-200/90 bg-white shadow-sm transition hover:border-ink-300 hover:shadow-md">
      <Link to={`/actualites/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-ink-100">
        {article.imageUrl ? (
          <SmartImage
            src={article.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            fallbackSeed={article.slug}
          />
        ) : (
          <div className="grid h-full place-items-center bg-[#f5f2ed] text-xs font-semibold uppercase tracking-wide text-ink-400">
            APIO
          </div>
        )}
      </Link>
      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5 sm:p-6"}`}>
        <span className="inline-flex w-fit rounded-full bg-[#f5f2ed] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-navy/70">
          {categoryLabel || NEWS_FR.categoryDefault}
        </span>
        <time className="mt-2 text-xs font-semibold text-ink-500" dateTime={article.publishedAt}>
          {NEWS_FR.publishedOn} {formatDate(article.publishedAt, "fr")}
        </time>
        <h2 className={`inst-news-card-title mt-2 ${compact ? "text-lg" : "text-xl"}`}>
          <Link to={`/actualites/${article.slug}`} className="text-navy hover:underline">
            {title}
          </Link>
        </h2>
        {excerpt && (
          <p className={`mt-3 flex-1 leading-relaxed text-ink-600 ${compact ? "line-clamp-2 text-sm" : "line-clamp-3 text-sm"}`}>
            {excerpt}
          </p>
        )}
        <Link
          to={`/actualites/${article.slug}`}
          className="home-text-link mt-4 inline-flex items-center gap-1 text-sm"
        >
          {NEWS_FR.readArticle} <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
