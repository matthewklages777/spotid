import { prisma } from "@/lib/prisma";

// Lightweight health check used by Railway (and any uptime monitor).
// Returns 200 when the app is up and the database is reachable.
export async function GET() {
  try {
    // Simple count query — works with all Prisma adapters including libsql
    await prisma.user.count();
    return Response.json({ status: "ok", db: "ok" });
  } catch {
    return Response.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
