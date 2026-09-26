import { apiFetch, apiRoot } from "./api";

export interface AdminNewsRow {
  id: string;
  slug: string;
  titleFr: string;
  titleAr: string;
  summaryFr: string;
  summaryAr: string;
  bodyFr: string;
  bodyAr: string;
  imageUrl: string | null;
  author: string | null;
  published: boolean;
  archived: boolean;
  publishedAt: string | null;
}

export interface AdminEventRow {
  id: string;
  slug: string | null;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  locationFr: string;
  locationAr: string;
  startsAt: string;
  endsAt: string | null;
  organizer: string | null;
  contactInfo: string | null;
  imageUrl: string | null;
  published: boolean;
}

export interface AdminDocumentRow {
  id: string;
  category: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  visibility: string;
  published: boolean;
  publishedAt: string | null;
  availability?: string;
  fileUrl: string | null;
  fileStorage: string | null;
}

export async function fetchAdminNews() {
  return apiFetch<{ articles: AdminNewsRow[] }>("/api/admin/news");
}

export async function saveAdminNews(payload: Partial<AdminNewsRow> & { slug: string; titleFr: string; titleAr: string; bodyFr: string; bodyAr: string }, isNew: boolean) {
  if (isNew) {
    return apiFetch<{ id: string; article: AdminNewsRow }>("/api/admin/news", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  return apiFetch<{ article: AdminNewsRow }>(`/api/admin/news/${payload.id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function archiveAdminNews(id: string) {
  return apiFetch(`/api/admin/news/${id}/archive`, { method: "POST" });
}

export async function deleteAdminNews(id: string) {
  return apiFetch(`/api/admin/news/${id}`, { method: "DELETE" });
}

export async function fetchAdminEvents() {
  return apiFetch<{ events: AdminEventRow[] }>("/api/admin/events");
}

export async function saveAdminEvent(payload: Record<string, unknown>, isNew: boolean, id?: string) {
  if (isNew) {
    return apiFetch<{ id: string; event: AdminEventRow }>("/api/admin/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  return apiFetch<{ event: AdminEventRow }>(`/api/admin/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminEvent(id: string) {
  return apiFetch(`/api/admin/events/${id}`, { method: "DELETE" });
}

export async function fetchAdminDocuments() {
  return apiFetch<{ documents: AdminDocumentRow[] }>("/api/admin/documents");
}

export async function saveAdminDocument(payload: Record<string, unknown>, isNew: boolean, id?: string) {
  if (isNew) {
    return apiFetch<{ id: string; document: AdminDocumentRow }>("/api/admin/documents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  return apiFetch<{ document: AdminDocumentRow }>(`/api/admin/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminDocument(id: string) {
  return apiFetch(`/api/admin/documents/${id}`, { method: "DELETE" });
}

export async function uploadAdminDocumentFile(id: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch(`${apiRoot()}/api/admin/documents/${id}/upload`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (body as { error?: string }).error || `Upload failed (${res.status})`, status: res.status };
    }
    return { data: body as { document: AdminDocumentRow }, status: res.status };
  } catch {
    return { error: "Network error", status: 0 };
  }
}
