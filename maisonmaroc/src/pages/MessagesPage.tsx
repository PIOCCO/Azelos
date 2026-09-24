import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowLeft, Search, Send } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import { useMessaging } from "../context/MessagingContext";
import { useListings } from "../context/ListingsContext";
import type { ConversationSummary, Message } from "../lib/messagingTypes";
import { formatPrice, relativeDate } from "../lib/format";
import SmartImage from "../components/SmartImage";
import { owners } from "../data/owners";

function messagesBase(role: string) {
  return role === "REAL_ESTATE_OWNER" ? "/owner/messages" : "/client/messages";
}

export default function MessagesPage({ role }: { role: "CLIENT" | "REAL_ESTATE_OWNER" }) {
  const { t, L, lang } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { propertyBySlug: propBySlug } = useListings();
  const {
    conversations,
    loading,
    search,
    setSearch,
    loadThread,
    sendMessage,
    archiveConversation,
    refresh,
  } = useMessaging();

  const [thread, setThread] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) {
    return <Navigate to={role === "CLIENT" ? "/client/login" : "/owner/login"} replace />;
  }
  if (user.role !== role) {
    return <Navigate to={messagesBase(user.role)} replace />;
  }

  useEffect(() => {
    if (!id) {
      setThread(null);
      setMessages([]);
      return;
    }
    loadThread(id).then((data) => {
      if (data) {
        setThread(data.conversation);
        setMessages(data.messages);
      }
    });
  }, [id, loadThread]);

  const property = thread ? propBySlug(thread.propertySlug) : undefined;
  const agent = thread ? owners.find((o) => o.id === thread.agentProfileId) : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !draft.trim()) return;
    setSending(true);
    const ok = await sendMessage(id, draft.trim());
    setSending(false);
    if (ok) {
      setDraft("");
      const data = await loadThread(id);
      if (data) {
        setThread(data.conversation);
        setMessages(data.messages);
      }
      refresh();
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      new: t("messages.statusNew"),
      replied: t("messages.statusReplied"),
      unread: t("messages.statusUnread"),
      archived: t("messages.statusArchived"),
    };
    return map[status] || status;
  };

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">{t("nav.messages")}</h1>
        {role === "REAL_ESTATE_OWNER" && (
          <Link to="/owner" className="text-sm font-semibold text-brand-700 hover:underline">
            {t("ownerDash.title")}
          </Link>
        )}
      </div>

      <div className="grid min-h-[70vh] overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        {/* Inbox */}
        <div className={`border-ink-200 lg:border-e ${id ? "hidden lg:block" : ""}`}>
          <div className="border-b border-ink-100 p-3">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-400" />
              <input
                className="input ps-9 text-sm"
                placeholder={t("messages.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[calc(70vh-56px)] overflow-y-auto">
            {role === "REAL_ESTATE_OWNER" && conversations.length > 0 && (
              <div className="hidden grid-cols-[1fr_1fr_auto] gap-2 border-b border-ink-100 bg-ink-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink-500 sm:grid">
                <span>{t("messages.client")}</span>
                <span>{t("nav.properties")}</span>
                <span>{t("adminDash.status")}</span>
              </div>
            )}
            {loading && <p className="p-4 text-sm text-ink-500">{t("common.loading")}</p>}
            {!loading && conversations.length === 0 && (
              <p className="p-6 text-sm text-ink-500">{t("messages.empty")}</p>
            )}
            {conversations.map((c) => {
              const p = propBySlug(c.propertySlug);
              const ag = owners.find((o) => o.id === c.agentProfileId);
              const active = c.id === id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`${messagesBase(role)}/${c.id}`)}
                  className={`flex w-full gap-3 border-b border-ink-50 p-3 text-start transition hover:bg-ink-50 ${
                    active ? "bg-brand-50/80" : ""
                  }`}
                >
                  <SmartImage
                    src={p?.images[0] || ""}
                    fallbackSeed={c.propertyId}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink-900">
                      {p ? L(p.title) : L(c.propertyPreview.title)}
                    </div>
                    <div className="truncate text-xs text-ink-500">
                      {role === "CLIENT"
                        ? `${t("messages.agent")}: ${ag ? L(ag.name) : c.agentProfileId}`
                        : `${t("messages.client")}: ${c.client.name}`}
                    </div>
                    <div className="mt-1 truncate text-xs text-ink-400">
                      {c.lastMessage?.body || t("messages.noMessagesYet")}
                    </div>
                  </div>
                  <div className="shrink-0 text-[10px] font-medium text-ink-400">
                    {c.lastMessage ? relativeDate(c.lastMessage.createdAt, lang) : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className={!id ? "hidden lg:flex lg:items-center lg:justify-center" : "flex flex-col"}>
          {!id && (
            <p className="hidden text-sm text-ink-400 lg:block">{t("messages.selectConversation")}</p>
          )}
          {id && thread && (
            <>
              <div className="border-b border-ink-100 p-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="lg:hidden text-brand-700"
                    onClick={() => navigate(messagesBase(role))}
                    aria-label={t("common.backHome")}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <SmartImage
                    src={property?.images[0] || ""}
                    fallbackSeed={thread.propertyId}
                    alt=""
                    className="h-16 w-20 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/property/${thread.propertySlug}`}
                      className="line-clamp-2 text-sm font-bold text-ink-900 hover:text-brand-700"
                    >
                      {property ? L(property.title) : L(thread.propertyPreview.title)}
                    </Link>
                    {property && (
                      <p className="text-sm font-semibold text-brand-700">
                        {formatPrice(property.price, lang)} {t("common.mad")}
                      </p>
                    )}
                    <p className="text-xs text-ink-500">
                      {role === "CLIENT"
                        ? `${t("messages.agent")}: ${agent ? L(agent.name) : thread.agentProfileId}`
                        : `${t("messages.client")}: ${thread.client.name}`}
                      {" · "}
                      <span className="font-medium">{statusLabel(thread.status)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-ink-400 hover:text-ink-700"
                    onClick={() => archiveConversation(thread.id).then(() => navigate(messagesBase(role)))}
                    title={t("messages.archive")}
                  >
                    <Archive size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50/50 p-4">
                {messages.map((m) => {
                  const mine = m.senderId === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                          mine
                            ? "bg-brand-700 text-white"
                            : "border border-ink-100 bg-white text-ink-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${mine ? "text-brand-100" : "text-ink-400"}`}
                        >
                          {relativeDate(m.createdAt, lang)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={submit} className="flex gap-2 border-t border-ink-100 p-3">
                <input
                  className="input flex-1 text-sm"
                  placeholder={t("messages.placeholder")}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" disabled={sending || !draft.trim()} className="btn-primary px-4">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
