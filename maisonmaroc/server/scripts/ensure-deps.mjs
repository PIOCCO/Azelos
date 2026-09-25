import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const multerPkg = path.join(serverRoot, "node_modules", "multer", "package.json");

if (fs.existsSync(multerPkg)) {
  process.exit(0);
}

console.error("[apio-server] Dependencies missing (multer). Running npm install in server/ …\n");
const result = spawnSync("npm", ["install"], { cwd: serverRoot, stdio: "inherit", shell: false });
process.exit(result.status === null ? 1 : result.status);
