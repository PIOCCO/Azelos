import type { Bilingual } from "../data/types";

export interface ProfileCompletion {
  percent: number;
  missing: { key: string; labelFr: string; labelAr: string; ok?: boolean }[];
}

export interface OwnerDashboardData {
  welcomeName: string;
  stats: {
    profileCompletion: number;
    catalogProjects: number;
    draftProjects: number;
    pendingProjects: number;
    draftOnly: number;
    memberDocuments: number;
    unreadMessages: number;
  };
  profileCompletion: ProfileCompletion;
}

export interface OwnerProfileBundle {
  account: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    status: string;
    ownerProfileId: string;
  };
  publicProfile: {
    id: string;
    name: Bilingual;
    agency?: Bilingual;
    type: string;
    cityId?: string;
    memberSince?: string;
    verified?: boolean;
    avatar?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string | null;
    bio?: Bilingual;
  };
  seedLocked: {
    name: Bilingual;
    agency?: Bilingual;
    type: string;
    cityId?: string;
    memberSince?: string;
    verified?: boolean;
  };
  overrides: {
    bioFr?: string | null;
    bioAr?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    emailPublic?: string | null;
    website?: string | null;
    avatarUrl?: string | null;
  } | null;
  profileCompletion: ProfileCompletion;
  publicProfilePath: string;
}

export type ProjectStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export interface OwnerProjectListItem {
  id: string;
  slug?: string;
  title: Bilingual;
  description?: Bilingual;
  cityId?: string | null;
  status: ProjectStatus | string;
  source: "catalog" | "draft";
  updatedAt?: string | null;
  createdAt?: string;
}

export interface OwnerProjectImage {
  id: string;
  url: string;
  mime: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface OwnerDocument {
  id: string;
  category: string;
  title: Bilingual;
  description: Bilingual;
  fileUrl: string | null;
  publishedAt?: string | null;
  availability?: string;
  fileFormat?: string;
}

export interface OwnerActivityItem {
  id: string;
  action: string;
  detail?: string | null;
  createdAt: string;
}

export interface OwnerRequestItem {
  id: string;
  subject?: string | null;
  message?: string | null;
  createdAt: string;
}

export interface OwnerMembership {
  status: string;
  statusKey: string;
  memberSince?: string;
  verified?: boolean;
  ownerProfileId: string;
  agency?: Bilingual;
}
