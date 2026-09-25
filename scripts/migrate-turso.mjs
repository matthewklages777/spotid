/**
 * Applies Prisma migration SQL files to a remote Turso (libsql) database.
 * Tracks applied migrations in a _migrations table so reruns are safe.
 * Used in start.sh when DATABASE_URL is a remote libsql:// URL.
 */
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.log("Not a remote Turso URL — skipping Turso migration runner.");
  process.exit(0);
}

const client = createClient({ url, authToken });

// Ensure migration tracking table exists
await client.execute(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Find already-applied migrations
const { rows } = await client.execute("SELECT name FROM _migrations");
const applied = new Set(rows.map((r) => r.name));

// Read migration directories in sorted order
const __dir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dir, "..", "prisma", "migrations");
const dirs = readdirSync(migrationsDir)
  .filter((d) => !d.includes(".") && !d.endsWith(".toml"))
  .sort();

let ran = 0;
for (const name of dirs) {
  if (applied.has(name)) continue;

  const sqlPath = join(migrationsDir, name, "migration.sql");
  const sql = readFileSync(sqlPath, "utf8");

  console.log(`Applying migration: ${name}`);

  // Split on statement separator and run each statement
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    await client.execute(stmt.endsWith(";") ? stmt : stmt + ";");
  }

  await client.execute({
    sql: "INSERT INTO _migrations (name) VALUES (?)",
    args: [name],
  });

  ran++;
}

console.log(`Turso migrations complete — ${ran} applied, ${applied.size} already up to date.`);
