import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Minimal property index parsed from frontend seed (id, slug, ownerId, titles). */
let cache = null;

function loadPropertyIndex() {
  if (cache) return cache;
  const tsPath = path.join(__dirname, "..", "..", "src", "data", "properties.ts");
  const raw = fs.readFileSync(tsPath, "utf8");
  const blocks = raw.split(/\n  \{\n/).slice(1);
  const items = [];
  for (const block of blocks) {
    const id = block.match(/id: "([^"]+)"/)?.[1];
    const slug = block.match(/slug: "([^"]+)"/)?.[1];
    const ownerId = block.match(/ownerId: "([^"]+)"/)?.[1];
    const titleFr = block.match(/fr: "([^"]+)"/)?.[1];
    const titleAr = block.match(/ar: "([^"]+)"/)?.[1];
    if (id && slug && ownerId) {
      items.push({ id, slug, ownerId, title: { fr: titleFr ?? id, ar: titleAr ?? id } });
    }
  }
  cache = items;
  return items;
}

export function listPublicProperties() {
  return loadPropertyIndex();
}

export function getPropertyBySlugOrId(slugOrId) {
  const all = loadPropertyIndex();
  return all.find((p) => p.slug === slugOrId || p.id === slugOrId) ?? null;
}

export function listPropertiesForOwnerProfile(ownerProfileId) {
  if (!ownerProfileId) return [];
  return loadPropertyIndex().filter((p) => p.ownerId === ownerProfileId);
}
