import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "data", "apio.sqlite");

export function openDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'REAL_ESTATE_OWNER', 'CLIENT')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
      auth_provider TEXT NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
      google_subject TEXT UNIQUE,
      owner_profile_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_owner_profile ON users(owner_profile_id);

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      property_slug TEXT NOT NULL,
      client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agent_profile_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'unread', 'archived')),
      archived_by_client INTEGER NOT NULL DEFAULT 0,
      archived_by_agent INTEGER NOT NULL DEFAULT 0,
      client_last_read_at TEXT,
      agent_last_read_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(client_id, property_id)
    );

    CREATE INDEX IF NOT EXISTS idx_conv_client ON conversations(client_id);
    CREATE INDEX IF NOT EXISTS idx_conv_agent ON conversations(agent_profile_id);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);

    CREATE TABLE IF NOT EXISTS news_posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title_fr TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      summary_fr TEXT,
      summary_ar TEXT,
      body_fr TEXT NOT NULL,
      body_ar TEXT NOT NULL,
      image_url TEXT,
      author TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      title_fr TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      description_fr TEXT,
      description_ar TEXT,
      location_fr TEXT,
      location_ar TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      organizer TEXT,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title_fr TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      description_fr TEXT,
      description_ar TEXT,
      file_url TEXT,
      visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members', 'admin')),
      published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_submissions (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      ip_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  ensureColumns(db);
}

function ensureColumns(db) {
  const addCol = (table, col, ddl) => {
    const names = db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name);
    if (!names.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
  };
  addCol("news_posts", "archived", "INTEGER NOT NULL DEFAULT 0");
  addCol("events", "contact_info", "TEXT");
  addCol("events", "image_url", "TEXT");
  addCol("documents", "file_storage", "TEXT");
  addCol("documents", "file_mime", "TEXT");
  addCol("documents", "file_size", "INTEGER");
}
