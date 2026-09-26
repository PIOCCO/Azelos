import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cache = null;

function loadOwnersIndex() {
  if (cache) return cache;
  const tsPath = path.join(__dirname, "..", "..", "src", "data", "owners.ts");
  const raw = fs.readFileSync(tsPath, "utf8");
  const blocks = raw.split(/\n  \{\n/).slice(1);
  const items = [];
  for (const block of blocks) {
    const id = block.match(/id: "([^"]+)"/)?.[1];
    if (!id) continue;
    const pickBilingual = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*\\{\\s*ar: "([^"]*)",\\s*fr: "([^"]*)"`, "s"));
      if (m) return { ar: m[1], fr: m[2] };
      return null;
    };
    items.push({
      id,
      name: pickBilingual("name"),
      agency: pickBilingual("agency"),
      type: block.match(/type: "([^"]+)"/)?.[1] ?? "agent",
      avatar: block.match(/avatar: "([^"]+)"/)?.[1] ?? "",
      verified: block.includes("verified: true"),
      phone: block.match(/phone: "([^"]+)"/)?.[1] ?? "",
      whatsapp: block.match(/whatsapp: "([^"]+)"/)?.[1] ?? "",
      email: block.match(/email: "([^"]+)"/)?.[1] ?? "",
      cityId: block.match(/cityId: "([^"]+)"/)?.[1] ?? "",
      memberSince: block.match(/memberSince: "([^"]+)"/)?.[1] ?? "",
      bio: pickBilingual("bio"),
    });
  }
  cache = items;
  return items;
}

export function getOwnerProfileById(ownerProfileId) {
  if (!ownerProfileId) return null;
  return loadOwnersIndex().find((o) => o.id === ownerProfileId) ?? null;
}

export function listKnownOwnerProfileIds() {
  return loadOwnersIndex().map((o) => o.id);
}
