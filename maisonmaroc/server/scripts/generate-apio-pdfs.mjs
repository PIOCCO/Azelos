#!/usr/bin/env node
/** Regenerate APIO template PDFs and sync SQLite document records. */
import "dotenv/config";
import { openDb, migrate } from "../src/db.js";
import { syncApioDocuments } from "../src/content.js";

const db = openDb();
migrate(db);
await syncApioDocuments(db);
db.close();
console.log("APIO document PDFs generated and database synced.");
