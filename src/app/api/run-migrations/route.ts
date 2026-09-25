import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  const url = (process.env.DATABASE_URL ?? "").trim();
  const authToken = (process.env.TURSO_AUTH_TOKEN ?? "").trim();
  const log: string[] = [];

  try {
    if (!url.startsWith("libsql://")) {
      return Response.json({ error: "Not a Turso URL", url });
    }

    log.push(`Connecting to: ${url}`);
    const client = createClient({ url, authToken });

    await client.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    log.push("_migrations table ready");

    // If User table doesn't exist, the DB is in a broken partial state — reset everything
    let userExists = false;
    try {
      await client.execute(`SELECT 1 FROM "User" LIMIT 1`);
      userExists = true;
    } catch { userExists = false; }

    if (!userExists) {
      log.push("User table missing — resetting all migrations for clean run");
      // Drop any partially-created tables and clear migration history
      const { rows: tables } = await client.execute(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      );
      for (const row of tables) {
        const t = String(row.name);
        if (t === "_migrations") continue;
        log.push(`Dropping: ${t}`);
        await client.execute(`DROP TABLE IF EXISTS "${t}"`);
      }
      await client.execute("DELETE FROM _migrations");
      log.push("Reset complete — will reapply all migrations");
    }

    const { rows } = await client.execute("SELECT name FROM _migrations");
    const applied = new Set(rows.map((r) => String(r.name)));
    log.push(`Already applied: ${applied.size}`);

    const migrationsDir = join(process.cwd(), "prisma", "migrations");
    const dirs = readdirSync(migrationsDir)
      .filter((d) => !d.includes(".") && !d.endsWith(".toml"))
      .sort();

    let ran = 0;
    for (const name of dirs) {
      if (applied.has(name)) { log.push(`Skip: ${name}`); continue; }

      const raw = readFileSync(join(migrationsDir, name, "migration.sql"), "utf8");
      log.push(`Applying: ${name}`);

      const statements = raw
        .replace(/--[^\n]*/g, "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await client.execute(stmt);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("already exists")) {
            log.push(`  already exists: ${stmt.slice(0, 50)}`);
          } else {
            log.push(`  ERROR: ${msg}`);
            log.push(`  stmt: ${stmt.slice(0, 100)}`);
            throw err;
          }
        }
      }

      await client.execute({ sql: "INSERT OR IGNORE INTO _migrations (name) VALUES (?)", args: [name] });
      ran++;
    }

    return Response.json({ ok: true, ran, log });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: msg, log }, { status: 500 });
  }
}
