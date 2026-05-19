import { prisma } from "@/lib/prisma";

// Lightweight health check used by Railway (and any uptime monitor).
// Returns 200 when the app is up and the database is reachable.
export async function GET() {
  try {
    // A minimal query that proves the DB connection is alive
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "ok" });
  } catch {
    return Response.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
