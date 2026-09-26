import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const adminPort = Number(process.env.APIO_ADMIN_DEV_WEB_PORT) || 5174;
const adminApiPort = Number(process.env.APIO_ADMIN_PORT) || 7217;

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: adminPort,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${adminApiPort}`,
        changeOrigin: true,
      },
    },
  },
});
