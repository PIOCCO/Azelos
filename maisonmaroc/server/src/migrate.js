import "dotenv/config";
import { openDb, migrate } from "./db.js";
import { syncApioDocuments } from "./content.js";
import {
  createUser,
  findUserByEmail,
  hashPassword,
  ROLES,
} from "./auth.js";

const db = openDb();
migrate(db);
await syncApioDocuments(db);

const adminEmail = process.env.SUPER_ADMIN_EMAIL;
const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
const adminName = process.env.SUPER_ADMIN_NAME || "Super Admin";

const existingAdmin = db
  .prepare(`SELECT id FROM users WHERE role = ? LIMIT 1`)
  .get(ROLES.SUPER_ADMIN);

if (!existingAdmin && adminEmail && adminPassword) {
  if (!findUserByEmail(db, adminEmail)) {
    createUser(db, {
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      name: adminName,
      role: ROLES.SUPER_ADMIN,
      authProvider: "local",
      emailVerifiedAt: new Date().toISOString(),
    });
    console.log(`Created SUPER_ADMIN: ${adminEmail}`);
  }
}

console.log("Migration complete.");
db.close();
