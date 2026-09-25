import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const origin = (process.env.VITE_CANONICAL_ORIGIN || "").replace(/\/+$/, "");
const basePath = (process.env.VITE_BASE_PATH || "./").replace(/\/?$/, "/");
const prefix = origin ? `${origin}${basePath === "./" ? "/" : basePath}` : "";

const routes = [
  "",
  "a-propos",
  "membres",
  "projets",
  "actualites",
  "evenements",
  "documents",
  "contact",
  "faq",
  "legal/mentions-legales",
  "legal/confidentialite",
  "legal/cookies",
  "legal/cgu",
];

const urls = routes
  .map((r) => {
    const loc = prefix ? `${prefix}${r}` : `/${r}`.replace("//", "/");
    return `  <url><loc>${loc}</loc></url>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const out = path.join(__dirname, "..", "public", "sitemap.xml");
fs.writeFileSync(out, xml);
const robots = `User-agent: *
Allow: /

${origin ? `Sitemap: ${prefix}sitemap.xml` : "# Set VITE_CANONICAL_ORIGIN at build to emit absolute Sitemap URL"}
`;
fs.writeFileSync(path.join(__dirname, "..", "public", "robots.txt"), robots);
console.log("Wrote sitemap.xml and robots.txt");
