import { prisma } from "@/lib/prisma";

// Deep DB health check — separate from /api/health so Railway healthcheck
// doesn't gate on DB availability. Hit this manually after deploy to verify
// migrations ran and the database is reachable.
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return Response.json({ status: "ok", db: "ok", userCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { status: "error", db: "unreachable", error: message },
      { status: 503 }
    );
  }
}
