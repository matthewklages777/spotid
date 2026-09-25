import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function resolveDbUrl(): string {
  const url = process.env["DATABASE_URL"];
  if (url) {
    if (url.startsWith("file:")) return url;
    if (url.startsWith("/")) return `file:${url}`;
    return url;
  }
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  return `file:${dbPath}`;
}

function createPrismaClient() {
  const url = resolveDbUrl();
  const authToken = process.env["TURSO_AUTH_TOKEN"];
  // Prisma 7: PrismaLibSql takes the config object directly
  const adapter = authToken
    ? new PrismaLibSql({ url, authToken })
    : new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

// Lazy singleton — only connects when first used, not at import time
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const value = (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
