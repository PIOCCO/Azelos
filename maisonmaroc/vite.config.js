import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
/** Demo on dribex.ma: `npm run build:dribex` → https://dribex.ma/apio/ */
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        base: mode === "dribex" ? "/apio/" : "/",
        plugins: [react()],
        server: {
            host: true,
            port: 5173,
        },
        preview: {
            host: true,
            port: 4173,
        },
    });
});
