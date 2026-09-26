/**
 * Normal (CLIENT) Google user must not get member profile or directory listing.
 * Uses DB inspection + public APIs (no real Google call).
 */
import { openDb, migrate } from "../src/db.js";
import { createUser, ROLES } from "../src/auth.js";
import { listPublicMemberProfiles } from "../src/memberProfiles.js";

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    passed++;
    console.log(`OK  ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}`);
  }
}

const db = openDb();
migrate(db);

const email = `google-client-${Date.now()}@test.apio.ma`;
const user = createUser(db, {
  email,
  name: "Google Test User",
  role: ROLES.CLIENT,
  authProvider: "google",
  googleSubject: `google-sub-${Date.now()}`,
  emailVerifiedAt: new Date().toISOString(),
});

assert("CLIENT has no owner_profile_id", !user.owner_profile_id);
const memberRow = db
  .prepare(`SELECT 1 FROM apio_member_profiles WHERE id = ?`)
  .get(user.owner_profile_id || "");
assert("No apio_member_profiles row for client", !memberRow);

const publicMembers = listPublicMemberProfiles(db);
assert("Client not in public member directory", !publicMembers.some((p) => p.email === email));

db.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
