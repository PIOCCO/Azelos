import { useEffect } from "react";
import { useLocale } from "../lib/useLocale";
import { INSTITUTION } from "../config/institution";

interface Props {
  title: string;
  description?: string;
  path?: string;
}

/** Updates document title and core meta tags for the active route. */
export default function PageMeta({ title, description, path = "" }: Props) {
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
    setMeta("og:type", "website", true);
    if (typeof window !== "undefined") {
      const base = window.location.origin + (import.meta.env.BASE_URL || "/");
      const canonical = new URL(path.replace(/^\//, ""), base).href.replace(/\/$/, "") || base;
      setMeta("og:url", canonical, true);
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = path ? canonical : window.location.href;
    }
  }, [fullTitle, desc, path]);

  return null;
}
