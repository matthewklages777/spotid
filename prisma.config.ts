// dotenv is intentionally not imported here — Railway injects env vars directly.
// For local dev, Next.js / the shell already loads .env before this runs.
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function getMigrateAdapter() {
  const url = process.env["DATABASE_URL"] ?? "file:./prisma/dev.db";
  const authToken = process.env["TURSO_AUTH_TOKEN"];
  const isRemote = url.startsWith("libsql://") || url.startsWith("wss://");
  return isRemote && authToken
    ? new PrismaLibSql({ url, authToken })
    : new PrismaLibSql({ url });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    adapter: getMigrateAdapter(),
  },
});
