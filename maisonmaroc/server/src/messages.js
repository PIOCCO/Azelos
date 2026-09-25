import { v4 as uuidv4 } from "uuid";
import { ROLES } from "./auth.js";
import { getPropertyBySlugOrId } from "./catalog.js";

const MAX_MESSAGE_LENGTH = 5000;

export function validateConversationPayload(body) {
  const propertyId = String(body?.propertyId ?? "").trim();
  const propertySlug = String(body?.propertySlug ?? "").trim();
  const agentProfileId = String(body?.agentProfileId ?? "").trim();
  if (!propertyId || !propertySlug || !agentProfileId) {
    return { ok: false, error: "propertyId, propertySlug, and agentProfileId are required" };
  }
  if (propertyId.length > 128 || propertySlug.length > 200 || agentProfileId.length > 128) {
    return { ok: false, error: "Invalid property reference" };
  }
  const property = getPropertyBySlugOrId(propertyId);
  if (!property || property.id !== propertyId || property.slug !== propertySlug) {
    return { ok: false, error: "Invalid property" };
  }
  if (property.ownerId !== agentProfileId) {
    return { ok: false, error: "Invalid agent for this property" };
  }
  return { ok: true, data: { propertyId, propertySlug, agentProfileId } };
}

export function validateMessageBody(body) {
  const text = String(body ?? "").trim();
  if (!text) return { ok: false, error: "Message body is required" };
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "Message is too long" };
  }
  return { ok: true, value: text };
}

export function listConversationsForUser(db, user) {
  if (user.role === ROLES.CLIENT) {
    return db
      .prepare(
        `SELECT * FROM conversations
         WHERE client_id = ? AND archived_by_client = 0
         ORDER BY updated_at DESC`,
      )
      .all(user.id);
  }
  if (user.role === ROLES.REAL_ESTATE_OWNER) {
    if (!user.ownerProfileId) return [];
    return db
      .prepare(
        `SELECT * FROM conversations
         WHERE agent_profile_id = ? AND archived_by_agent = 0
         ORDER BY updated_at DESC`,
      )
      .all(user.ownerProfileId);
  }
  return [];
}

export function getConversation(db, id) {
  return db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id);
}

export function canAccessConversation(conv, user) {
  if (!conv || !user) return false;
  if (user.role === ROLES.CLIENT) return conv.client_id === user.id;
  if (user.role === ROLES.REAL_ESTATE_OWNER) {
    return conv.agent_profile_id === user.ownerProfileId;
  }
  return false;
}

export function findConversationByClientProperty(db, clientId, propertyId) {
  return db
    .prepare(`SELECT * FROM conversations WHERE client_id = ? AND property_id = ?`)
    .get(clientId, propertyId);
}

export function createConversation(db, { clientId, propertyId, propertySlug, agentProfileId }) {
  const existing = findConversationByClientProperty(db, clientId, propertyId);
  if (existing) return existing;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO conversations (
      id, property_id, property_slug, client_id, agent_profile_id,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'new', ?, ?)`,
  ).run(id, propertyId, propertySlug, clientId, agentProfileId, now, now);
  return getConversation(db, id);
}

export function listMessages(db, conversationId) {
  return db
    .prepare(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
    )
    .all(conversationId);
}

export function addMessage(db, { conversationId, senderId, body }) {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, conversationId, senderId, body.trim(), now);

  const conv = getConversation(db, conversationId);
  const senderIsClient = senderId === conv.client_id;
  const status = senderIsClient ? "new" : "replied";
  db.prepare(
    `UPDATE conversations SET status = ?, updated_at = ?,
      client_last_read_at = CASE WHEN ? THEN datetime('now') ELSE client_last_read_at END,
      agent_last_read_at = CASE WHEN ? THEN datetime('now') ELSE agent_last_read_at END
     WHERE id = ?`,
  ).run(
    status,
    now,
    senderIsClient ? 1 : 0,
    senderIsClient ? 0 : 1,
    conversationId,
  );
  return db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id);
}

export function markConversationRead(db, conv, user) {
  const now = new Date().toISOString();
  if (user.role === ROLES.CLIENT && conv.client_id === user.id) {
    db.prepare(
      `UPDATE conversations SET client_last_read_at = ?, status = CASE WHEN status = 'unread' THEN 'replied' ELSE status END WHERE id = ?`,
    ).run(now, conv.id);
  } else if (
    user.role === ROLES.REAL_ESTATE_OWNER &&
    conv.agent_profile_id === user.ownerProfileId
  ) {
    db.prepare(
      `UPDATE conversations SET agent_last_read_at = ?, status = CASE WHEN status = 'new' THEN 'replied' ELSE status END WHERE id = ?`,
    ).run(now, conv.id);
  }
}

export function archiveConversation(db, conv, user) {
  if (user.role === ROLES.CLIENT && conv.client_id === user.id) {
    db.prepare(`UPDATE conversations SET archived_by_client = 1 WHERE id = ?`).run(conv.id);
  } else if (
    user.role === ROLES.REAL_ESTATE_OWNER &&
    conv.agent_profile_id === user.ownerProfileId
  ) {
    db.prepare(`UPDATE conversations SET archived_by_agent = 1 WHERE id = ?`).run(conv.id);
  }
}

export function unreadCountForUser(db, user) {
  const convs = listConversationsForUser(db, user);
  let count = 0;
  for (const c of convs) {
    const msgs = listMessages(db, c.id);
    if (!msgs.length) continue;
    const last = msgs[msgs.length - 1];
    if (user.role === ROLES.CLIENT) {
      if (last.sender_id !== user.id && (!c.client_last_read_at || c.client_last_read_at < last.created_at)) {
        count++;
      }
    } else if (user.role === ROLES.REAL_ESTATE_OWNER) {
      if (last.sender_id === c.client_id && (!c.agent_last_read_at || c.agent_last_read_at < last.created_at)) {
        count++;
      }
    }
  }
  return count;
}
