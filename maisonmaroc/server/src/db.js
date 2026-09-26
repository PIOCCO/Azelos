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
  addCol("documents", "doc_availability", "TEXT NOT NULL DEFAULT 'coming_soon'");
  addCol("documents", "file_format", "TEXT");
  addCol("documents", "sort_order", "INTEGER NOT NULL DEFAULT 0");
  addCol("documents", "view_url", "TEXT");

  db.exec(`
    CREATE TABLE IF NOT EXISTS owner_profile_overrides (
      owner_profile_id TEXT PRIMARY KEY,
      bio_fr TEXT,
      bio_ar TEXT,
      phone TEXT,
      whatsapp TEXT,
      email_public TEXT,
      website TEXT,
      avatar_url TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS owner_project_drafts (
      id TEXT PRIMARY KEY,
      owner_profile_id TEXT NOT NULL,
      title_fr TEXT NOT NULL DEFAULT '',
      title_ar TEXT NOT NULL DEFAULT '',
      description_fr TEXT NOT NULL DEFAULT '',
      description_ar TEXT NOT NULL DEFAULT '',
      city_id TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_owner_drafts_profile ON owner_project_drafts(owner_profile_id);

    CREATE TABLE IF NOT EXISTS owner_project_images (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES owner_project_drafts(id) ON DELETE CASCADE,
      storage_name TEXT NOT NULL,
      mime TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_owner_proj_images ON owner_project_images(project_id);

    CREATE TABLE IF NOT EXISTS owner_activity_log (
      id TEXT PRIMARY KEY,
      owner_profile_id TEXT NOT NULL,
      user_id TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_owner_activity_profile ON owner_activity_log(owner_profile_id);

    CREATE TABLE IF NOT EXISTS apio_member_profiles (
      id TEXT PRIMARY KEY,
      name_fr TEXT NOT NULL DEFAULT '',
      name_ar TEXT NOT NULL DEFAULT '',
      agency_fr TEXT,
      agency_ar TEXT,
      profile_type TEXT NOT NULL DEFAULT 'agency',
      city_id TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      avatar_url TEXT,
      bio_fr TEXT,
      bio_ar TEXT,
      website TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      member_since TEXT,
      contact_name TEXT,
      contact_position TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
  `);

  addCol("owner_project_drafts", "slug", "TEXT");
  addCol("owner_project_drafts", "listing_transaction", "TEXT NOT NULL DEFAULT 'sale'");
  addCol("owner_project_drafts", "property_type", "TEXT NOT NULL DEFAULT 'apartment'");
  addCol("owner_project_drafts", "price", "INTEGER NOT NULL DEFAULT 0");
  addCol("owner_project_drafts", "surface", "REAL NOT NULL DEFAULT 0");
  addCol("owner_project_drafts", "bedrooms", "INTEGER NOT NULL DEFAULT 0");
  addCol("owner_project_drafts", "bathrooms", "INTEGER NOT NULL DEFAULT 1");
  addCol("owner_project_drafts", "furnished", "INTEGER NOT NULL DEFAULT 0");
  addCol("owner_project_drafts", "amenities_json", "TEXT NOT NULL DEFAULT '[]'");
  addCol("owner_project_drafts", "neighborhood_fr", "TEXT NOT NULL DEFAULT ''");
  addCol("owner_project_drafts", "neighborhood_ar", "TEXT NOT NULL DEFAULT ''");
  addCol("owner_project_drafts", "lat", "REAL");
  addCol("owner_project_drafts", "lng", "REAL");
  addCol("owner_project_drafts", "hidden", "INTEGER NOT NULL DEFAULT 0");
  addCol("owner_project_drafts", "published_at", "TEXT");
  addCol("owner_profile_overrides", "avatar_storage", "TEXT");
  addCol("owner_profile_overrides", "avatar_mime", "TEXT");
  addCol("users", "email_verified_at", "TEXT");
  db.prepare(
    `UPDATE users SET email_verified_at = COALESCE(email_verified_at, created_at)
     WHERE role = 'SUPER_ADMIN' AND email_verified_at IS NULL`,
  ).run();

  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      purpose TEXT NOT NULL CHECK (purpose IN ('email_verify', 'password_reset')),
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_purpose ON auth_tokens(user_id, purpose);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(purpose, token_hash);
  `);
}
