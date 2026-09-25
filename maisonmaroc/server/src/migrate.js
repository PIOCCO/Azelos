import "dotenv/config";
import { openDb, migrate } from "./db.js";
import { seedApioDocuments } from "./content.js";
import {
  createUser,
  findUserByEmail,
  hashPassword,
  ROLES,
} from "./auth.js";

const db = openDb();
migrate(db);
seedApioDocuments(db);

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
    });
    console.log(`Created SUPER_ADMIN: ${adminEmail}`);
  }
}

/** Demo owner linked to seed agent profile (optional bootstrap). */
const demoOwnerEmail = process.env.DEMO_OWNER_EMAIL;
const demoOwnerPassword = process.env.DEMO_OWNER_PASSWORD;
if (demoOwnerEmail && demoOwnerPassword && !findUserByEmail(db, demoOwnerEmail)) {
  createUser(db, {
    email: demoOwnerEmail,
    passwordHash: hashPassword(demoOwnerPassword),
    name: "Ahmed El Amrani",
    phone: "+212661234567",
    role: ROLES.REAL_ESTATE_OWNER,
    ownerProfileId: "ahmed-el-amrani",
    authProvider: "local",
  });
  console.log(`Created demo REAL_ESTATE_OWNER: ${demoOwnerEmail}`);
}

console.log("Migration complete.");
db.close();
