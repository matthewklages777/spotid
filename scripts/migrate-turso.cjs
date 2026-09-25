"use strict";
const { createClient } = require("@libsql/client");
const { readdirSync, readFileSync } = require("fs");
const { join } = require("path");

async function main() {
  const url = (process.env.DATABASE_URL || "").trim();
  const authToken = (process.env.TURSO_AUTH_TOKEN || "").trim();

  if (!url.startsWith("libsql://")) {
    console.log("Not a remote Turso URL — skipping.");
    return;
  }

  console.log("Connecting to Turso:", url);
  const client = createClient({ url, authToken });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const { rows } = await client.execute("SELECT name FROM _migrations");
  const applied = new Set(rows.map((r) => r.name));
  console.log("Already applied:", applied.size);

  const migrationsDir = join(__dirname, "..", "prisma", "migrations");
  const dirs = readdirSync(migrationsDir)
    .filter((d) => !d.includes(".") && !d.endsWith(".toml"))
    .sort();

  let ran = 0;
  for (const name of dirs) {
    if (applied.has(name)) continue;

    const sqlPath = join(migrationsDir, name, "migration.sql");
    const raw = readFileSync(sqlPath, "utf8");
    console.log("Applying:", name);

    const statements = raw
      .replace(/--[^\n]*/g, "")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (err) {
        // Skip "already exists" errors from partial previous runs
        if (err.message && err.message.includes("already exists")) {
          console.log("  Skipping (already exists):", stmt.slice(0, 60));
        } else {
          throw err;
        }
      }
    }

    await client.execute({
      sql: "INSERT OR IGNORE INTO _migrations (name) VALUES (?)",
      args: [name],
    });
    ran++;
  }

  console.log(`Done — ${ran} applied, ${applied.size} already up to date.`);
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
