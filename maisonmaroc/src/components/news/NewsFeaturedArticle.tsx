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
};

export default function NewsFeaturedArticle({ article, title, excerpt, categoryLabel }: Props) {
  return (
    <article className="inst-news-featured overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm lg:grid lg:grid-cols-2">
      <Link to={`/actualites/${article.slug}`} className="relative block min-h-[220px] lg:min-h-full">
        {article.imageUrl ? (
          <SmartImage
            src={article.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallbackSeed={`featured-${article.slug}`}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[#f5f2ed] text-sm font-semibold uppercase tracking-wide text-ink-400">
            APIO
          </div>
        )}
      </Link>
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-navy/60">{NEWS_FR.featured}</p>
        <span className="mt-2 inline-flex rounded-full bg-[#f5f2ed] px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy/70">
          {categoryLabel || NEWS_FR.categoryDefault}
        </span>
        <time className="mt-3 text-sm font-semibold text-ink-500" dateTime={article.publishedAt}>
          {NEWS_FR.publishedOn} {formatDate(article.publishedAt, "fr")}
        </time>
        <h2 className="home-section-title mt-3 text-2xl sm:text-[1.65rem]">
          <Link to={`/actualites/${article.slug}`} className="hover:underline">
            {title}
          </Link>
        </h2>
        {excerpt && <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">{excerpt}</p>}
        <Link to={`/actualites/${article.slug}`} className="home-btn home-btn-primary mt-6 inline-flex w-fit">
          {NEWS_FR.readArticle} <ArrowRight size={16} className="ms-2" />
        </Link>
      </div>
    </article>
  );
}
