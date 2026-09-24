export type ConversationStatus = "new" | "replied" | "unread" | "archived";

export interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  propertyId: string;
  propertySlug: string;
  agentProfileId: string;
  status: ConversationStatus;
  updatedAt: string;
  client: { id: string; name: string; email: string };
  propertyPreview: {
    id: string;
    slug: string;
    title: { fr: string; ar: string };
  };
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
}
