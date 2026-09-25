import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "data", "uploads");

const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES) || 10 * 1024 * 1024;

const EXT_BY_MIME = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAGIC = [
  { mime: "application/pdf", check: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  { mime: "image/jpeg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    mime: "image/webp",
    check: (b) =>
      b.length > 11 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

export function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function detectMime(buffer) {
  for (const m of MAGIC) {
    if (m.check(buffer)) return m.mime;
  }
  return null;
}

export const documentUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    const allowed = Object.keys(EXT_BY_MIME);
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
}).single("file");

export function persistValidatedUpload(buffer, claimedMime) {
  const detected = detectMime(buffer);
  if (!detected || detected !== claimedMime) {
    throw Object.assign(new Error("File content does not match allowed type"), { status: 400 });
  }
  const ext = EXT_BY_MIME[detected];
  const storageName = `${randomUUID()}${ext}`;
  const abs = path.join(UPLOAD_DIR, storageName);
  if (!abs.startsWith(UPLOAD_DIR)) {
    throw Object.assign(new Error("Invalid storage path"), { status: 500 });
  }
  fs.writeFileSync(abs, buffer, { mode: 0o640 });
  return { storageName, mime: detected, size: buffer.length };
}

export function resolveStoredFile(storageName) {
  const base = path.basename(String(storageName || ""));
  if (!base || base !== storageName || base.includes("..")) return null;
  const abs = path.join(UPLOAD_DIR, base);
  if (!abs.startsWith(UPLOAD_DIR)) return null;
  if (!fs.existsSync(abs)) return null;
  return abs;
}

export function deleteStoredFile(storageName) {
  const abs = resolveStoredFile(storageName);
  if (abs) fs.unlinkSync(abs);
}
