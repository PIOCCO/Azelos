import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function normalizeBase(raw: string | undefined) {
  const base = (raw ?? "./").trim() || "./";
  if (base === "/" || base === "./" || base === ".") return "./";
  return base.endsWith("/") ? base : `${base}/`;
}

export default defineConfig({
  base: normalizeBase(process.env.VITE_BASE_PATH),
  plugins: [react()],
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
