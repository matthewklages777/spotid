import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

function resolveDbPath(): string {
  // In production (Railway) set DATABASE_URL to the volume-mounted db file,
  // e.g. "file:/data/spotid.db" or just "/data/spotid.db".
  // In dev it falls back to the local prisma/dev.db file.
  const url = process.env["DATABASE_URL"];
  if (url) {
    // Strip the "file:" prefix — better-sqlite3 wants a plain filesystem path
    return url.startsWith("file:") ? url.slice(5) : url;
  }
  return path.join(process.cwd(), "prisma", "dev.db");
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: resolveDbPath() });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
