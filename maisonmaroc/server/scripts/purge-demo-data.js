/**
 * Remove legacy demo/sample rows from APIO SQLite (schema preserved).
 * Usage: node scripts/purge-demo-data.js
 * Keeps SUPER_ADMIN users and institutional document catalog rows.
 */
import "dotenv/config";
import { openDb, migrate } from "../src/db.js";

const db = openDb();
migrate(db);

const demoNews = db.prepare(`DELETE FROM news_posts WHERE slug = ?`).run("bienvenue-apio");
const demoUsers = db
  .prepare(
    `DELETE FROM users WHERE role != 'SUPER_ADMIN' AND (
      email LIKE '%@test.apio.ma' OR
      email LIKE 'owner.demo@%' OR
      owner_profile_id IN ('ahmed-el-amrani', 'sara-benali', 'youssef-alami', 'fatima-bennani', 'karim-ouazzani', 'nadia-chakir', 'omar-tazi', 'leila-mansouri')
    )`,
  )
  .run();

const orphanProfiles = db
  .prepare(
    `DELETE FROM apio_member_profiles WHERE id NOT IN (
      SELECT owner_profile_id FROM users WHERE owner_profile_id IS NOT NULL
    )`,
  )
  .run();

console.log(
  JSON.stringify(
    {
      deletedDemoNews: demoNews.changes,
      deletedNonAdminUsers: demoUsers.changes,
      deletedOrphanProfiles: orphanProfiles.changes,
    },
    null,
    2,
  ),
);

db.close();
