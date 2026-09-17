const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 8000;

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

app.get("/health", async (_req, res) => {
  try {
    if (pool) {
      await pool.query("SELECT 1");
    }
    res.json({ status: "ok", service: "node-api" });
  } catch (err) {
    res.status(503).json({ status: "fail", error: "db_unavailable" });
  }
});

app.get("/api/items", async (_req, res) => {
  if (!pool) {
    return res.json({ items: [] });
  }
  const result = await pool.query("SELECT id, name FROM items ORDER BY id");
  res.json({ items: result.rows });
});

const server = app.listen(port, () => {
  console.log(`node api listening on ${port}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
