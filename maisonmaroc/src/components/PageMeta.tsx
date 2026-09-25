import { useEffect } from "react";
import { useLocale } from "../lib/useLocale";
import { INSTITUTION } from "../config/institution";
import { CANONICAL_ORIGIN } from "../config/site";

interface Props {
  title: string;
  description?: string;
  path?: string;
  imageUrl?: string | null;
  ogType?: "website" | "article";
}

/** Updates document title and core meta tags for the active route. */
export default function PageMeta({ title, description, path = "", imageUrl, ogType = "website" }: Props) {
  const { lang } = useLocale();
  const fullTitle = title.includes("APIO") ? title : `${title} | APIO`;
  const desc =
    description ||
    (lang === "fr"
      ? INSTITUTION.tagline.fr
      : INSTITUTION.tagline.ar);

  useEffect(() => {
    document.title = fullTitle;
    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta("description", desc);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", desc, true);
    setMeta("og:type", ogType, true);
    if (imageUrl) {
      setMeta("og:image", imageUrl, true);
    }
    if (typeof window !== "undefined") {
      const base = CANONICAL_ORIGIN || window.location.origin + (import.meta.env.BASE_URL || "/");
      const canonicalPath = path.startsWith("/") ? path : `/${path}`;
      const canonical = CANONICAL_ORIGIN
        ? `${CANONICAL_ORIGIN}${canonicalPath}`.replace(/([^:]\/)\/+/g, "$1")
        : new URL(path.replace(/^\//, ""), base).href.replace(/\/$/, "") || base;
      setMeta("og:url", canonical, true);
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = path ? canonical : window.location.href;
    }
  }, [fullTitle, desc, path, imageUrl, ogType]);

  return null;
}
