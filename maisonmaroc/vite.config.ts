import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Copy `public/APIO/homepage-style` → `dist/homepage-style` so URLs are `{base}homepage-style/…`. */
function apioHomepageStyleDistCopy(): Plugin {
  const src = path.resolve(__dirname, "public/APIO/homepage-style");
  return {
    name: "apio-homepage-style-dist-copy",
    closeBundle() {
      if (!fs.existsSync(src)) return;
      const dest = path.resolve(__dirname, "dist/homepage-style");
      fs.cpSync(src, dest, { recursive: true });
    },
  };
}

function normalizeBase(raw: string | undefined) {
  const base = (raw ?? "./").trim() || "./";
  if (base === "/" || base === "./" || base === ".") return "./";
  return base.endsWith("/") ? base : `${base}/`;
}

export default defineConfig({
  base: normalizeBase(process.env.VITE_BASE_PATH),
  plugins: [react(), apioHomepageStyleDistCopy()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
});
