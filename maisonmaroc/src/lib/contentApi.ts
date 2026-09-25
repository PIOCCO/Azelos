import type { Bilingual } from "../data/types";
import { apiFetch } from "./api";

export interface NewsArticle {
  id: string;
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  body: Bilingual;
  imageUrl: string | null;
  author: string | null;
  publishedAt: string;
}

export interface AssociationEvent {
  id: string;
  slug: string;
  title: Bilingual;
  description: Bilingual;
  location: Bilingual;
  startsAt: string;
  endsAt: string | null;
  organizer: string | null;
  contactInfo?: string | null;
  imageUrl?: string | null;
}

export interface PublicDocument {
  id: string;
  category: string;
  title: Bilingual;
  description: Bilingual;
  fileUrl: string | null;
  publishedAt: string;
}

export async function fetchNews() {
  return apiFetch<{ articles: NewsArticle[] }>("/api/content/news");
}

export async function fetchNewsArticle(slug: string) {
  return apiFetch<{ article: NewsArticle }>(`/api/content/news/${encodeURIComponent(slug)}`);
}

export async function fetchEvents(upcomingOnly = false) {
  const q = upcomingOnly ? "?upcoming=1" : "";
  return apiFetch<{ events: AssociationEvent[] }>(`/api/content/events${q}`);
}

export async function fetchDocuments() {
  return apiFetch<{ documents: PublicDocument[] }>("/api/content/documents");
}

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function submitContact(payload: ContactPayload) {
  return apiFetch<{ ok: boolean }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
