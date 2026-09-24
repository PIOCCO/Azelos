import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../lib/api";
import type { ConversationSummary, Message } from "../lib/messagingTypes";
import { useAuth } from "./AuthContext";

const LS_KEY = "mm.messaging.v1";

interface MessagingContextValue {
  conversations: ConversationSummary[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  startConversation: (input: {
    propertyId: string;
    propertySlug: string;
    agentProfileId: string;
  }) => Promise<ConversationSummary | null>;
  loadThread: (id: string) => Promise<{ conversation: ConversationSummary; messages: Message[] } | null>;
  sendMessage: (conversationId: string, body: string) => Promise<boolean>;
  archiveConversation: (conversationId: string) => Promise<void>;
  search: string;
  setSearch: (q: string) => void;
  useLocalFallback: boolean;
}

const MessagingContext = createContext<MessagingContextValue | undefined>(undefined);

function loadLocal(): ConversationSummary[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ConversationSummary[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(conversations: ConversationSummary[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(conversations));
}

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || (user.role !== "CLIENT" && user.role !== "REAL_ESTATE_OWNER")) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    const q = search.trim();
    const path = q ? `/api/messages/conversations?q=${encodeURIComponent(q)}` : "/api/messages/conversations";
    const { data, status } = await apiFetch<{ conversations: ConversationSummary[] }>(path);
    const unread = await apiFetch<{ count: number }>("/api/messages/unread-count");
    setLoading(false);
    if (status === 0 || !data) {
      setUseLocalFallback(true);
      setConversations(loadLocal());
      setUnreadCount(0);
      return;
    }
    setUseLocalFallback(false);
    setConversations(data.conversations);
    setUnreadCount(unread.data?.count ?? 0);
  }, [user, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startConversation = useCallback(
    async (input: {
      propertyId: string;
      propertySlug: string;
      agentProfileId: string;
    }) => {
      if (!user || user.role !== "CLIENT") return null;
      const { data, status } = await apiFetch<{ conversation: ConversationSummary }>(
        "/api/messages/conversations",
        { method: "POST", body: JSON.stringify(input) },
      );
      if (data?.conversation) {
        await refresh();
        return data.conversation;
      }
      if (status === 0) {
        const local = loadLocal();
        const existing = local.find(
          (c) => c.propertyId === input.propertyId && c.client.id === user.id,
        );
        if (existing) return existing;
        const created: ConversationSummary = {
          id: `local-${Date.now()}`,
          propertyId: input.propertyId,
          propertySlug: input.propertySlug,
          agentProfileId: input.agentProfileId,
          status: "new",
          updatedAt: new Date().toISOString(),
          client: { id: user.id, name: user.name, email: user.email },
          propertyPreview: {
            id: input.propertyId,
            slug: input.propertySlug,
            title: { fr: input.propertySlug, ar: input.propertySlug },
          },
          lastMessage: null,
        };
        saveLocal([created, ...local]);
        setConversations([created, ...local]);
        setUseLocalFallback(true);
        return created;
      }
      return null;
    },
    [user, refresh],
  );

  const loadThread = useCallback(async (id: string) => {
    const { data } = await apiFetch<{
      conversation: ConversationSummary;
      messages: Message[];
    }>(`/api/messages/conversations/${id}`);
    if (data) return data;
    return { conversation: conversations.find((c) => c.id === id)!, messages: [] };
  }, [conversations]);

  const sendMessage = useCallback(
    async (conversationId: string, body: string) => {
      if (!user) return false;
      const { data, status } = await apiFetch<{ message: Message }>(
        `/api/messages/conversations/${conversationId}/messages`,
        { method: "POST", body: JSON.stringify({ body }) },
      );
      if (data?.message) {
        await refresh();
        return true;
      }
      if (status === 0 && useLocalFallback) {
        const local = loadLocal();
        const idx = local.findIndex((c) => c.id === conversationId);
        if (idx >= 0) {
          local[idx] = {
            ...local[idx],
            lastMessage: {
              body,
              createdAt: new Date().toISOString(),
              senderId: user.id,
            },
            updatedAt: new Date().toISOString(),
            status: user.role === "CLIENT" ? "new" : "replied",
          };
          saveLocal(local);
          setConversations(local);
        }
        return true;
      }
      return false;
    },
    [user, refresh, useLocalFallback],
  );

  const archiveConversation = useCallback(
    async (conversationId: string) => {
      await apiFetch(`/api/messages/conversations/${conversationId}/archive`, {
        method: "PATCH",
      });
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      conversations,
      unreadCount,
      loading,
      refresh,
      startConversation,
      loadThread,
      sendMessage,
      archiveConversation,
      search,
      setSearch,
      useLocalFallback,
    }),
    [
      conversations,
      unreadCount,
      loading,
      refresh,
      startConversation,
      loadThread,
      sendMessage,
      archiveConversation,
      search,
      useLocalFallback,
    ],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}
