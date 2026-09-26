import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { logSecurityEvent } from "./securityLog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR_RAW =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "data", "uploads");
export const UPLOAD_DIR = path.resolve(UPLOAD_DIR_RAW);

const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES) || 10 * 1024 * 1024;
const MIN_BYTES = 16;

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

const FORBIDDEN_SNIPPETS = [
  "<script",
  "<svg",
  "<?php",
  "<!doctype",
  "<html",
  "#!/bin/",
  "MZ",
];

export function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function detectMime(buffer) {
  if (!buffer || buffer.length < MIN_BYTES) return null;
  for (const m of MAGIC) {
    if (m.check(buffer)) return m.mime;
  }
  return null;
}

function looksLikeExecutableOrMarkup(buffer) {
  const head = buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf8").toLowerCase();
  for (const snip of FORBIDDEN_SNIPPETS) {
    if (head.includes(snip.toLowerCase())) return true;
  }
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) return true;
  return false;
}

function validateBuffer(buffer, allowedMimes) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw Object.assign(new Error("Empty upload"), { status: 400 });
  }
  if (buffer.length < MIN_BYTES) {
    throw Object.assign(new Error("File too small"), { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    throw Object.assign(new Error("File too large"), { status: 413 });
  }
  if (looksLikeExecutableOrMarkup(buffer)) {
    logSecurityEvent("upload_rejected_markup", { size: buffer.length });
    throw Object.assign(new Error("File content not allowed"), { status: 400 });
  }
  const detected = detectMime(buffer);
  if (!detected || !allowedMimes.includes(detected)) {
    logSecurityEvent("upload_rejected_mime", { detected, allowed: allowedMimes.join(",") });
    throw Object.assign(new Error("File content does not match allowed type"), { status: 400 });
  }
  return detected;
}

/** Admin document uploads — PDF only. */
export const documentUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, parts: 4, fields: 8 },
  fileFilter(_req, file, cb) {
    const name = String(file.originalname || "").slice(0, 255);
    if (name.includes("\0") || name.includes("..")) {
      return cb(new Error("Invalid filename"));
    }
    const lower = name.toLowerCase();
    if (lower.endsWith(".svg") || lower.endsWith(".html") || lower.endsWith(".htm")) {
      return cb(new Error("Unsupported file type"));
    }
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF uploads are allowed for documents"));
    }
    cb(null, true);
  },
}).single("file");

export function persistValidatedUpload(buffer, { allowedMimes = Object.keys(EXT_BY_MIME) } = {}) {
  const detected = validateBuffer(buffer, allowedMimes);
  const ext = EXT_BY_MIME[detected];
  const storageName = `${randomUUID()}${ext}`;
  const abs = path.resolve(UPLOAD_DIR, storageName);
  if (!abs.startsWith(UPLOAD_DIR + path.sep) && abs !== UPLOAD_DIR) {
    throw Object.assign(new Error("Invalid storage path"), { status: 500 });
  }
  fs.writeFileSync(abs, buffer, { mode: 0o640 });
  return { storageName, mime: detected, size: buffer.length };
}

function assertPdfStructure(buffer) {
  const head = buffer.subarray(0, Math.min(buffer.length, 16)).toString("ascii");
  if (!head.startsWith("%PDF-")) {
    throw Object.assign(new Error("Invalid PDF header"), { status: 400 });
  }
  if (buffer.length < 64) {
    throw Object.assign(new Error("PDF file too small"), { status: 400 });
  }
}

export function persistValidatedPdfUpload(buffer) {
  const stored = persistValidatedUpload(buffer, { allowedMimes: ["application/pdf"] });
  assertPdfStructure(buffer);
  return stored;
}

export function resolveStoredFile(storageName) {
  const base = path.basename(String(storageName || ""));
  if (!base || base !== storageName || base.includes("..") || base.includes("/") || base.includes("\\")) {
    return null;
  }
  if (base.startsWith(".") || base.length > 128) return null;
  const abs = path.resolve(UPLOAD_DIR, base);
  if (!abs.startsWith(UPLOAD_DIR + path.sep)) return null;
  if (!fs.existsSync(abs)) return null;
  return abs;
}

export function deleteStoredFile(storageName) {
  const abs = resolveStoredFile(storageName);
  if (abs) {
    fs.unlinkSync(abs);
    logSecurityEvent("upload_deleted", { storageName: path.basename(storageName) });
  }
}
