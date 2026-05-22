import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
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
  const client = createClient({ url: resolveDbUrl() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaLibSql(client as any);
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
